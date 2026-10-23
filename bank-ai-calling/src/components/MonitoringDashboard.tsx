"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Activity,
  Server,
  Database,
  Cpu,
  Layers,
  PhoneCall,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
  Radio,
  HardDrive,
  BarChart3,
  TrendingUp,
  Volume2,
  Bell,
  Check,
  Wifi,
  Search,
  Zap,
} from "lucide-react";

interface SnapshotData {
  timestamp: string;
  overallStatus: "healthy" | "degraded" | "critical";
  host: {
    hostname: string;
    platform: string;
    arch: string;
    uptimeSeconds: number;
    cpuCount: number;
    cpuPercent: number;
    totalMemoryMb: number;
    usedMemoryMb: number;
    freeMemoryMb: number;
    memoryPercent: number;
  };
  process: {
    pid: number;
    uptimeSeconds: number;
    nodeVersion: string;
    heapUsedMb: number;
    heapTotalMb: number;
    rssMb: number;
    eventLoopLagMs: number;
  };
  services: {
    name: string;
    status: "healthy" | "degraded" | "down" | "unconfigured";
    latencyMs?: number;
    message?: string;
    lastChecked: string;
  }[];
  database: {
    provider: string;
    status: string;
    latencyMs: number;
    activeCallsCount: number;
    totalCalls: number;
    completedCalls: number;
    failedCalls: number;
    noAnswerCalls: number;
    queuedCalls: number;
    answerRate: number;
    failureRate: number;
    outcomesBreakdown: { outcome: string; count: number }[];
  };
  queue: {
    status: string;
    latencyMs?: number;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  };
  alerts: {
    id: string;
    severity: "critical" | "warning" | "info";
    rule: string;
    message: string;
    currentValue: string;
    threshold: string;
    timestamp: string;
    acknowledged: boolean;
  }[];
  history: {
    timestamp: string;
    cpuPercent: number;
    memoryMb: number;
    memoryPercent: number;
    dbLatencyMs: number;
    activeCalls: number;
    queueDepth: number;
  }[];
}

export function MonitoringDashboard({ initialData }: { initialData: SnapshotData }) {
  const [data, setData] = useState<SnapshotData>(initialData);
  const [refreshInterval, setRefreshInterval] = useState<number>(10); // 10s default
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [timeRange, setTimeRange] = useState<"15m" | "1h" | "24h">("1h");
  const [activeTab, setActiveTab] = useState<"overview" | "services" | "telephony" | "alerts" | "logs">("overview");
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [logSearch, setLogSearch] = useState<string>("");

  const fetchMetrics = useCallback(async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/monitoring/metrics");
      if (!res.ok) throw new Error("Failed to fetch monitoring telemetry");
      const json = await res.json();
      setData(json);
      if (showToast) toast.success("Telemetry refreshed");
    } catch {
      if (showToast) toast.error("Could not reach telemetry service");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Polling effect
  useEffect(() => {
    if (refreshInterval === 0) return;
    const timer = setInterval(() => {
      fetchMetrics();
    }, refreshInterval * 1000);
    return () => clearInterval(timer);
  }, [refreshInterval, fetchMetrics]);

  async function handleAcknowledgeAlert(alertId: string) {
    try {
      const res = await fetch("/api/monitoring/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, action: "acknowledge" }),
      });
      if (!res.ok) throw new Error("Failed to acknowledge");
      toast.success("Alert acknowledged");
      setData((prev) => ({
        ...prev,
        alerts: prev.alerts.map((a) =>
          a.id === alertId ? { ...a, acknowledged: true } : a
        ),
      }));
    } catch {
      toast.error("Failed to update alert");
    }
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  const statusColor =
    data.overallStatus === "healthy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : data.overallStatus === "degraded"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-red-50 text-red-700 border-red-200";

  return (
    <div className="space-y-6">
      {/* Top Controller & Health Banner */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#004e9f] border border-blue-100">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Platform Observability</h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border capitalize ${statusColor}`}>
                  {data.overallStatus === "healthy" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  {data.overallStatus === "degraded" && <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />}
                  {data.overallStatus === "critical" && <XCircle className="h-3.5 w-3.5 text-red-600" />}
                  System {data.overallStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Host: <span className="font-mono text-slate-700">{data.host.hostname}</span> · Uptime:{" "}
                <span className="font-semibold text-slate-800">{formatUptime(data.process.uptimeSeconds)}</span> · Node{" "}
                <span className="font-mono text-slate-600">{data.process.nodeVersion}</span>
              </p>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto refresh dropdown */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500 font-medium">Refresh:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={5}>Every 5s</option>
                <option value={10}>Every 10s</option>
                <option value={30}>Every 30s</option>
                <option value={0}>Paused</option>
              </select>
            </div>

            {/* Manual refresh button */}
            <button
              onClick={() => fetchMetrics(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#004e9f]" : "text-slate-500"}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "overview"
                ? "bg-[#004e9f] text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Infrastructure Overview
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "services"
                ? "bg-[#004e9f] text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Subsystems & Dependencies ({data.services.length})
          </button>
          <button
            onClick={() => setActiveTab("telephony")}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "telephony"
                ? "bg-[#004e9f] text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            AI Calling & Telephony Pipeline
          </button>
          <button
            onClick={() => setActiveTab("alerts")}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "alerts"
                ? "bg-[#004e9f] text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bell className="h-3 w-3" />
            Alerts & Incidents ({data.alerts.length})
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Core Hardware & Engine Gauges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Host Memory */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Host Memory (RAM)</span>
                <Server className="h-4 w-4 text-[#004e9f]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{data.host.memoryPercent}%</span>
                <span className="text-xs text-slate-500">
                  {data.host.usedMemoryMb} / {data.host.totalMemoryMb} MB
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    data.host.memoryPercent > 85 ? "bg-red-500" : data.host.memoryPercent > 70 ? "bg-amber-500" : "bg-[#004e9f]"
                  }`}
                  style={{ width: `${Math.min(100, data.host.memoryPercent)}%` }}
                />
              </div>
            </div>

            {/* Node Heap */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Node.js Heap Memory</span>
                <Cpu className="h-4 w-4 text-purple-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{data.process.heapUsedMb} MB</span>
                <span className="text-xs text-slate-500">of {data.process.heapTotalMb} MB</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                RSS: {data.process.rssMb} MB · PID {data.process.pid}
              </p>
            </div>

            {/* Database Latency */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">PostgreSQL Neon Latency</span>
                <Database className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{data.database.latencyMs} ms</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  data.database.status === "healthy" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {data.database.status}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">SELECT 1 probe roundtrip</p>
            </div>

            {/* Event Loop Delay */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Event-Loop Delay</span>
                <Zap className="h-4 w-4 text-amber-500" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">{data.process.eventLoopLagMs} ms</span>
                <span className="text-xs text-slate-500">Node thread</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Execution concurrency health</p>
            </div>
          </div>

          {/* Historical Trend Charts (SVG) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Memory & Resource Utilization Trend */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Memory & Resource History</h3>
                  <p className="text-[11px] text-slate-500">Rolling host memory utilization (%) snapshots</p>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                  {data.history.length} samples
                </span>
              </div>

              {/* Sparkline Canvas / SVG */}
              <div className="h-40 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-100">
                {data.history.length === 0 ? (
                  <div className="w-full flex items-center justify-center text-xs text-slate-400">
                    Awaiting historical samples...
                  </div>
                ) : (
                  data.history.slice(-30).map((pt, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div
                        className="w-full rounded-t bg-[#004e9f]/80 hover:bg-[#004e9f] transition-all"
                        style={{ height: `${Math.max(8, pt.memoryPercent)}%` }}
                      />
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 transition-opacity">
                        {pt.memoryPercent}% ({pt.memoryMb} MB)
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                <span>Oldest sample</span>
                <span>Current live ({data.host.memoryPercent}%)</span>
              </div>
            </div>

            {/* Database & API Latency Trend */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Database & Query Latency</h3>
                  <p className="text-[11px] text-slate-500">Prisma database response roundtrip (ms)</p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                  {data.database.latencyMs} ms current
                </span>
              </div>

              {/* Sparkline Canvas / SVG */}
              <div className="h-40 w-full flex items-end gap-1.5 pt-6 pb-2 border-b border-slate-100">
                {data.history.length === 0 ? (
                  <div className="w-full flex items-center justify-center text-xs text-slate-400">
                    Awaiting latency samples...
                  </div>
                ) : (
                  data.history.slice(-30).map((pt, idx) => {
                    const barHeight = Math.min(100, Math.max(10, Math.round((pt.dbLatencyMs / 500) * 100)));
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full rounded-t bg-emerald-500/80 hover:bg-emerald-600 transition-all"
                          style={{ height: `${barHeight}%` }}
                        />
                        <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-8 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 transition-opacity">
                          {pt.dbLatencyMs} ms
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                <span>0 ms</span>
                <span>Target &lt; 200 ms</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SERVICES & SUBSYSTEMS */}
      {activeTab === "services" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Infrastructure Subsystems</h3>
              <p className="text-xs text-slate-500">Health and responsiveness of all backing services and API integrations.</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
              {data.services.filter((s) => s.status === "healthy").length} of {data.services.length} Healthy
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {data.services.map((svc, idx) => {
              const badge =
                svc.status === "healthy"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : svc.status === "degraded"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : svc.status === "down"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-slate-100 text-slate-600 border-slate-200";

              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                      <Radio className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{svc.name}</p>
                      {svc.message && <p className="text-[11px] text-slate-500">{svc.message}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {svc.latencyMs !== undefined && (
                      <span className="text-xs font-mono text-slate-500">
                        {svc.latencyMs} ms
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${badge}`}>
                      {svc.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: TELEPHONY & VOICE PIPELINE */}
      {activeTab === "telephony" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Active Calls</span>
              <p className="mt-2 text-2xl font-bold text-[#004e9f]">{data.database.activeCallsCount}</p>
              <p className="mt-1 text-[11px] text-slate-400">Live in-progress telephony</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Total Placed Calls</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.database.totalCalls}</p>
              <p className="mt-1 text-[11px] text-slate-400">{data.database.completedCalls} completed successfully</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">Answer Rate</span>
              <p className="mt-2 text-2xl font-bold text-emerald-600">{data.database.answerRate}%</p>
              <p className="mt-1 text-[11px] text-slate-400">Contact percentage</p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">BullMQ Queue Waiting</span>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data.queue.waiting}</p>
              <p className="mt-1 text-[11px] text-slate-400">{data.queue.active} currently processing</p>
            </div>
          </div>

          {/* AI Outcome Verdict Breakdown */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">AI Verdict Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Structured outcomes extracted across conversation sessions.</p>

            {data.database.outcomesBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">No AI call summaries recorded yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {data.database.outcomesBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <span className="text-[11px] font-medium text-slate-600 block truncate">
                      {item.outcome.replace(/_/g, " ")}
                    </span>
                    <span className="text-lg font-bold text-slate-900 mt-1 block">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: ALERTS & INCIDENTS */}
      {activeTab === "alerts" && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Incident & Alert Center</h3>
              <p className="text-xs text-slate-500">Real-time thresholds evaluated against telemetry metrics.</p>
            </div>
            <span className="text-xs font-semibold text-[#004e9f] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
              {data.alerts.length} Evaluated Rules
            </span>
          </div>

          {data.alerts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-slate-900">All Metrics Within Thresholds</p>
              <p className="text-xs text-slate-500 mt-0.5">No critical or warning incidents currently detected.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.alerts.map((alert) => (
                <div key={alert.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          alert.severity === "critical"
                            ? "bg-red-50 text-red-700 border border-red-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {alert.severity}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{alert.rule}</span>
                      {alert.acknowledged && (
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.2 rounded">
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                      Current: <strong className="text-slate-700">{alert.currentValue}</strong> (Threshold: {alert.threshold})
                    </p>
                  </div>

                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors shrink-0"
                    >
                      <Check className="h-3 w-3 text-slate-500" />
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
