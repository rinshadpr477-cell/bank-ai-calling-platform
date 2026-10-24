import os from "os";
import { performance } from "perf_hooks";
import { prisma } from "@/lib/prisma";
import { getCampaignQueue } from "@/lib/campaignQueue";

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "down" | "unconfigured";
  latencyMs?: number;
  message?: string;
  lastChecked: string;
}

export interface MetricDataPoint {
  timestamp: string;
  cpuPercent: number;
  memoryMb: number;
  memoryPercent: number;
  dbLatencyMs: number;
  activeCalls: number;
  queueDepth: number;
}

export interface SystemAlert {
  id: string;
  severity: "critical" | "warning" | "info";
  rule: string;
  message: string;
  currentValue: string;
  threshold: string;
  timestamp: string;
  acknowledged: boolean;
}

// In-memory ring buffer for historical metric trend snapshots
const MAX_SNAPSHOTS = 120;
const metricSnapshots: MetricDataPoint[] = [];

// In-memory acknowledged alerts registry
const acknowledgedAlertIds = new Set<string>();

/**
 * Measure real Node.js event-loop lag in milliseconds
 */
export async function measureEventLoopLag(): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      resolve(Math.round(lag * 100) / 100);
    });
  });
}

/**
 * Capture host CPU utilization percentage across cores
 */
function getCpuUsagePercent(): number {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return 0;

  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    const times = cpu.times as Record<string, number>;
    for (const type in times) {
      totalTick += times[type] ?? 0;
    }
    totalIdle += cpu.times.idle;
  }

  const idleFraction = totalIdle / totalTick;
  return Math.round((1 - idleFraction) * 100);
}

/**
 * Measure database ping latency using Prisma
 */
async function checkDatabaseHealth(): Promise<{ status: "healthy" | "degraded" | "down"; latencyMs: number; message?: string }> {
  const start = performance.now();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    const latencyMs = Math.round(performance.now() - start);
    return {
      status: latencyMs > 500 ? "degraded" : "healthy",
      latencyMs,
    };
  } catch (err: unknown) {
    return {
      status: "down",
      latencyMs: Math.round(performance.now() - start),
      message: err instanceof Error ? err.message : "Database connection error",
    };
  }
}

/**
 * Check BullMQ & Redis health and queue depths
 */
async function checkQueueAndRedisHealth(): Promise<{
  redisStatus: "healthy" | "degraded" | "down" | "unconfigured";
  redisLatencyMs?: number;
  jobCounts: { waiting: number; active: number; completed: number; failed: number; delayed: number };
}> {
  const defaultJobCounts = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    return {
      redisStatus: "unconfigured",
      jobCounts: defaultJobCounts,
    };
  }

  const start = performance.now();
  try {
    const queue = getCampaignQueue();
    // BullMQ exposes getJobCounts on Queue
    const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    const latencyMs = Math.round(performance.now() - start);

    return {
      redisStatus: latencyMs > 300 ? "degraded" : "healthy",
      redisLatencyMs: latencyMs,
      jobCounts: {
        waiting: counts.waiting || 0,
        active: counts.active || 0,
        completed: counts.completed || 0,
        failed: counts.failed || 0,
        delayed: counts.delayed || 0,
      },
    };
  } catch {
    return {
      redisStatus: "down",
      redisLatencyMs: Math.round(performance.now() - start),
      jobCounts: defaultJobCounts,
    };
  }
}

/**
 * Check Bridge Server (Node.js telephony & WebSocket bridge on port 8080)
 */
async function checkBridgeServerHealth(): Promise<ServiceHealth> {
  const bridgeUrl = process.env.BRIDGE_SERVER_URL || "http://localhost:8080";
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${bridgeUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeout);
    const latencyMs = Math.round(performance.now() - start);

    if (res && res.ok) {
      return {
        name: "Telephony Bridge Service",
        status: latencyMs > 800 ? "degraded" : "healthy",
        latencyMs,
        lastChecked: new Date().toISOString(),
      };
    }

    // Try root as fallback
    const rootRes = await fetch(`${bridgeUrl}/`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    }).catch(() => null);

    if (rootRes) {
      return {
        name: "Telephony Bridge Service",
        status: "healthy",
        latencyMs: Math.round(performance.now() - start),
        lastChecked: new Date().toISOString(),
      };
    }

    return {
      name: "Telephony Bridge Service",
      status: "down",
      latencyMs,
      message: `Failed to reach bridge at ${bridgeUrl}`,
      lastChecked: new Date().toISOString(),
    };
  } catch (err: unknown) {
    return {
      name: "Telephony Bridge Service",
      status: "down",
      latencyMs: Math.round(performance.now() - start),
      message: err instanceof Error ? err.message : "Bridge unreachable",
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Collect complete system observability snapshot
 */
export async function getSystemObservabilitySnapshot() {
  const now = new Date();
  const eventLoopLag = await measureEventLoopLag();
  const cpuPercent = getCpuUsagePercent();

  // Host Memory
  const totalMemBytes = os.totalmem();
  const freeMemBytes = os.freemem();
  const usedMemBytes = totalMemBytes - freeMemBytes;
  const memoryPercent = Math.round((usedMemBytes / totalMemBytes) * 100);

  // Node Process Memory
  const processMem = process.memoryUsage();
  const heapUsedMb = Math.round(processMem.heapUsed / (1024 * 1024));
  const heapTotalMb = Math.round(processMem.heapTotal / (1024 * 1024));
  const rssMb = Math.round(processMem.rss / (1024 * 1024));

  // Run Service & Subsystem Health Checks in parallel
  const [
    dbHealth,
    queueHealth,
    bridgeHealth,
    callStats,
    callSummaryStats,
    activeCallsCount,
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkQueueAndRedisHealth(),
    checkBridgeServerHealth(),
    prisma.call.groupBy({
      by: ["status"],
      _count: { status: true },
    }).catch(() => []),
    prisma.callSummary.groupBy({
      by: ["callOutcome"],
      _count: { callOutcome: true },
    }).catch(() => []),
    prisma.call.count({
      where: { status: "IN_PROGRESS" },
    }).catch(() => 0),
  ]);

  // Aggregate Call Status counts
  let totalCalls = 0;
  let completedCalls = 0;
  let failedCalls = 0;
  let noAnswerCalls = 0;
  let queuedCalls = 0;

  for (const item of callStats) {
    const count = item._count.status;
    totalCalls += count;
    if (item.status === "COMPLETED") completedCalls += count;
    if (item.status === "FAILED") failedCalls += count;
    if (item.status === "NO_ANSWER") noAnswerCalls += count;
    if (item.status === "QUEUED") queuedCalls += count;
  }

  // Calculate Telephony Performance Metrics
  const answerRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;
  const failureRate = totalCalls > 0 ? Math.round((failedCalls / totalCalls) * 100) : 0;

  // External services configuration validation
  const twilioConfigured = Boolean(
    process.env.TWILIO_ACCOUNT_SID_PROXY || process.env.TWILIO_ACCOUNT_SID
  );
  const geminiConfigured = Boolean(process.env.GOOGLE_GENAI_API_KEY);
  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );

  const services: ServiceHealth[] = [
    {
      name: "Next.js Web Engine",
      status: "healthy",
      latencyMs: eventLoopLag,
      lastChecked: now.toISOString(),
    },
    {
      name: "Neon PostgreSQL (Prisma)",
      status: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
      message: dbHealth.message,
      lastChecked: now.toISOString(),
    },
    {
      name: "Redis & BullMQ Engine",
      status: queueHealth.redisStatus,
      latencyMs: queueHealth.redisLatencyMs,
      lastChecked: now.toISOString(),
    },
    bridgeHealth,
    {
      name: "Twilio Telephony Integration",
      status: twilioConfigured ? "healthy" : "unconfigured",
      lastChecked: now.toISOString(),
      message: twilioConfigured ? "Proxy credentials configured" : "Twilio credentials missing",
    },
    {
      name: "Google Gemini Live API",
      status: geminiConfigured ? "healthy" : "unconfigured",
      lastChecked: now.toISOString(),
      message: geminiConfigured ? "Gemini key active" : "API key missing",
    },
    {
      name: "Razorpay Billing Gateway",
      status: razorpayConfigured ? "healthy" : "unconfigured",
      lastChecked: now.toISOString(),
      message: razorpayConfigured ? "API keys loaded" : "Unconfigured",
    },
  ];

  // Derive Overall System Status
  const criticalCount = services.filter((s) => s.status === "down").length;
  const degradedCount = services.filter((s) => s.status === "degraded").length;
  let overallStatus: "healthy" | "degraded" | "critical" = "healthy";

  if (criticalCount > 0) {
    overallStatus = "critical";
  } else if (degradedCount > 0 || memoryPercent > 90 || eventLoopLag > 120) {
    overallStatus = "degraded";
  }

  // Push live measurement to ring buffer
  const currentSnapshot: MetricDataPoint = {
    timestamp: now.toISOString(),
    cpuPercent,
    memoryMb: Math.round(usedMemBytes / (1024 * 1024)),
    memoryPercent,
    dbLatencyMs: dbHealth.latencyMs,
    activeCalls: activeCallsCount,
    queueDepth: queueHealth.jobCounts.waiting + queueHealth.jobCounts.active,
  };

  metricSnapshots.push(currentSnapshot);
  if (metricSnapshots.length > MAX_SNAPSHOTS) {
    metricSnapshots.shift();
  }

  // Evaluate Alerts
  const alerts: SystemAlert[] = [];

  if (memoryPercent >= 88) {
    alerts.push({
      id: "alert-high-memory",
      severity: memoryPercent >= 94 ? "critical" : "warning",
      rule: "Host RAM Pressure",
      message: `System memory utilization is currently at ${memoryPercent}%`,
      currentValue: `${memoryPercent}%`,
      threshold: "88%",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-high-memory"),
    });
  }

  if (eventLoopLag >= 80) {
    alerts.push({
      id: "alert-event-loop-lag",
      severity: eventLoopLag >= 150 ? "critical" : "warning",
      rule: "Node.js Event Loop Delay",
      message: `Event-loop latency has reached ${eventLoopLag}ms`,
      currentValue: `${eventLoopLag}ms`,
      threshold: "80ms",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-event-loop-lag"),
    });
  }

  if (dbHealth.status === "down") {
    alerts.push({
      id: "alert-db-down",
      severity: "critical",
      rule: "PostgreSQL Database Unreachable",
      message: dbHealth.message || "Failed to query Neon PostgreSQL",
      currentValue: "Offline",
      threshold: "Online",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-db-down"),
    });
  } else if (dbHealth.latencyMs > 450) {
    alerts.push({
      id: "alert-db-latency",
      severity: "warning",
      rule: "High Database Latency",
      message: `Prisma query ping is slow (${dbHealth.latencyMs}ms)`,
      currentValue: `${dbHealth.latencyMs}ms`,
      threshold: "450ms",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-db-latency"),
    });
  }

  if (queueHealth.redisStatus === "down") {
    alerts.push({
      id: "alert-redis-down",
      severity: "critical",
      rule: "Redis Connection Failure",
      message: "BullMQ queue is unable to connect to Redis instance",
      currentValue: "Offline",
      threshold: "Online",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-redis-down"),
    });
  }

  if (queueHealth.jobCounts.waiting > 40) {
    alerts.push({
      id: "alert-queue-backlog",
      severity: "warning",
      rule: "BullMQ Queue Backlog",
      message: `${queueHealth.jobCounts.waiting} campaign calls are waiting in queue`,
      currentValue: `${queueHealth.jobCounts.waiting} jobs`,
      threshold: "40 jobs",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-queue-backlog"),
    });
  }

  if (failureRate > 25 && totalCalls > 5) {
    alerts.push({
      id: "alert-call-failures",
      severity: "warning",
      rule: "High Telephony Call Failure Rate",
      message: `${failureRate}% of attempted voice calls have failed`,
      currentValue: `${failureRate}%`,
      threshold: "25%",
      timestamp: now.toISOString(),
      acknowledged: acknowledgedAlertIds.has("alert-call-failures"),
    });
  }

  return {
    timestamp: now.toISOString(),
    overallStatus,
    host: {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptimeSeconds: Math.round(os.uptime()),
      cpuCount: os.cpus().length,
      cpuPercent,
      totalMemoryMb: Math.round(totalMemBytes / (1024 * 1024)),
      usedMemoryMb: Math.round(usedMemBytes / (1024 * 1024)),
      freeMemoryMb: Math.round(freeMemBytes / (1024 * 1024)),
      memoryPercent,
    },
    process: {
      pid: process.pid,
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      heapUsedMb,
      heapTotalMb,
      rssMb,
      eventLoopLagMs: eventLoopLag,
    },
    services,
    database: {
      provider: "Neon PostgreSQL",
      status: dbHealth.status,
      latencyMs: dbHealth.latencyMs,
      activeCallsCount,
      totalCalls,
      completedCalls,
      failedCalls,
      noAnswerCalls,
      queuedCalls,
      answerRate,
      failureRate,
      outcomesBreakdown: callSummaryStats.map((s) => ({
        outcome: s.callOutcome || "UNKNOWN",
        count: s._count.callOutcome,
      })),
    },
    queue: {
      status: queueHealth.redisStatus,
      latencyMs: queueHealth.redisLatencyMs,
      ...queueHealth.jobCounts,
    },
    alerts,
    history: metricSnapshots,
  };
}

/**
 * Acknowledge or toggle an alert
 */
export function acknowledgeAlert(alertId: string) {
  acknowledgedAlertIds.add(alertId);
}

export function clearAcknowledgedAlert(alertId: string) {
  acknowledgedAlertIds.delete(alertId);
}
