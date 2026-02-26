export const OPS_SCHEDULES = {
  payoutOutbox: { every: "1m", batchSize: 50 },
  webhookProcess: { every: "1m", batchSize: 200 },
  reconcilePull: { every: "5m", batchSize: 100 },
  stuckRepair: { every: "15m", batchSize: 200 },
  integritySentinelHourly: { every: "60m", scope: "recent" },
  integritySentinelDaily: { every: "24h", scope: "full" }
};

export function getRecommendedCronExpressions(timezone = "Europe/Istanbul") {
  return {
    payoutOutbox: "* * * * *",        // Every minute
    webhookProcess: "* * * * *",      // Every minute
    reconcilePull: "*/5 * * * *",     // Every 5 minutes
    stuckRepair: "*/15 * * * *",      // Every 15 minutes
    integritySentinelHourly: "0 * * * *",   // Minute 0 past every hour
    integritySentinelDaily: "0 2 * * *"     // At 02:00 every day
  };
}
