import 'dotenv/config';
import { Worker } from 'bullmq';
import { campaignQueue, CampaignCallJob } from './lib/campaignQueue';
import { triggerNextCampaignCall } from './lib/orchestration';

/**
 * The queue worker — a separate long-running process from server.ts.
 * server.ts still handles the live Twilio/Gemini audio bridge directly
 * (that has to be low-latency and stateful); this worker only handles
 * the "which customer gets called next" decision, which is exactly the
 * kind of job a queue is meant for — retryable, observable, and safe to
 * scale to multiple workers later if call volume grows.
 */

const connection = (campaignQueue.opts as { connection: unknown }).connection;

const worker = new Worker<CampaignCallJob>(
  'campaign-calls',
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} — campaign ${job.data.campaignId}`);
    await triggerNextCampaignCall(job.data.campaignId);
  },
  {
    connection: connection as never,
    concurrency: 1, // one call attempt at a time, matching how Twilio dialing already works
  }
);

worker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

console.log('🚀 Campaign queue worker started, listening for jobs...');