import { Queue, ConnectionOptions } from "bullmq";

function buildConnectionOptions(): ConnectionOptions {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");

  const parsed = new URL(url);
  const isTls = parsed.protocol === "rediss:";

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    ...(isTls ? { tls: {} } : {}),
    maxRetriesPerRequest: null, // required by BullMQ for blocking operations
  };
}

export interface CampaignCallJob {
  campaignId: string;
}

export const campaignQueue = new Queue<CampaignCallJob>("campaign-calls", {
  connection: buildConnectionOptions(),
});