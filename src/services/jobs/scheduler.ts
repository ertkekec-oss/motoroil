import { JobDispatcher } from './jobDispatcher';
import { JobRegistry } from './jobRegistry';

export class JobScheduler {

    /**
     * Dispatch an immediate fire-and-forget or unique job dynamically.
     */
    static async scheduleOneOffJob(jobType: string, payload: any, scheduledFor: Date, idempotencyKey?: string) {
        return await JobDispatcher.dispatchDelayedJob({
            jobType,
            payload,
            scheduledFor,
            idempotencyKey
        });
    }

    /**
     * Called during system boot to pre-fill known hourly/daily tasks natively 
     * if no external Cron orchestrator is actively injected.
     */
    static loadDefaultSchedules() {
        console.log('[SCHEDULER] Loaded embedded default schedules.');

        const now = Date.now();
        const hourly = 3600 * 1000;
        const daily = 24 * 3600 * 1000;

        const scheduleSafely = (jobType: string, idempotencyKey: string, payload: any = {}, delayMs: number) => {
            JobDispatcher.dispatchDelayedJob({
                jobType,
                payload,
                scheduledFor: new Date(Date.now() + delayMs),
                idempotencyKey
            }).catch(() => { });
        };

        // Shipping Polling (Every 10 minutes)
        scheduleSafely('POLL_ACTIVE_SHIPMENTS', 'SYS_POLL_SHIPPING_HBSJT', { carrierCode: 'HEPSIJET' }, 10 * 60 * 1000);

        // Escrow Due Release Checks (Hourly)
        scheduleSafely('CHECK_ESCROW_RELEASE_DUE', 'SYS_HOURLY_ESCROW_RELEASE', { scope: 'GLOBAL' }, hourly);

        // Dispute SLA Check (Hourly)
        scheduleSafely('DISPUTE_SLA_CHECK', 'SYS_HOURLY_DISPUTE_SLA', { scope: 'GLOBAL' }, hourly);

        // Market Signals Recompute (Nightly)
        scheduleSafely('RECOMPUTE_MARKET_SIGNALS', 'SYS_NIGHTLY_MARKET_COMPUTE', { context: 'global' }, 6 * hourly);

        // Reputation Recompute (Nightly)
        scheduleSafely('RECOMPUTE_REPUTATION_SCORE', 'SYS_NIGHTLY_REP_COMPUTE', { target: 'GLOBAL_NIGHTLY' }, 7 * hourly);

        // Finance Risk Recompute (Nightly)
        scheduleSafely('RECOMPUTE_TRADE_RISK', 'SYS_NIGHTLY_RISK_COMPUTE', { target: 'GLOBAL_NIGHTLY' }, 8 * hourly);

        // Graph Cache Maintenance (Nightly)
        scheduleSafely('BACKFILL_GRAPH_CACHE', 'SYS_NIGHTLY_GRAPH_MAINT', { mode: 'FULL_SCAN' }, 9 * hourly);

        // LIQUIDITY ENGINE SCANS
        scheduleSafely('SCAN_LIQUIDITY_SUPPLY', 'SYS_SCAN_SUPPLY', {}, 30 * 60 * 1000); // 30 mins
        scheduleSafely('SCAN_LIQUIDITY_DEMAND', 'SYS_SCAN_DEMAND', {}, 30 * 60 * 1000); // 30 mins
        scheduleSafely('GENERATE_LIQUIDITY_MATCHES', 'SYS_MATCH_LIQUIDITY', {}, hourly); // hourly
        scheduleSafely('EXPIRE_LIQUIDITY_OPPORTUNITIES', 'SYS_EXPIRE_LIQUIDITY', {}, daily); // nightly

        // AUTONOMOUS TRADE EXECUTION
        scheduleSafely('GENERATE_TRADE_PROPOSALS', 'SYS_GENERATE_PROPOSALS', {}, 30 * 60 * 1000); // 30 mins
        scheduleSafely('RANK_TRADE_PROPOSALS', 'SYS_RANK_PROPOSALS', {}, hourly); // hourly
        scheduleSafely('EXPIRE_TRADE_PROPOSALS', 'SYS_EXPIRE_PROPOSALS', {}, daily); // nightly

        // PHASE 17.X INTELLIGENCE & SECURITY
        scheduleSafely('GENERATE_PRICE_SIGNALS', 'SYS_PRICE_SIGNALS', {}, hourly); // hourly
        scheduleSafely('RECALCULATE_SUPPLIER_CAPACITY', 'SYS_CAPACITY_EST', {}, daily); // daily
        scheduleSafely('REFRESH_DISCOVERY_PROFILES', 'SYS_DISCOVERY_PROFILES', {}, daily); // daily
        scheduleSafely('SCAN_TRADE_ABUSE_SIGNALS', 'SYS_ABUSE_SCAN', {}, hourly * 2); // every 2 hours
        scheduleSafely('BUILD_TRADE_ANALYTICS_SNAPSHOTS', 'SYS_ANALYTICS_SNAPSHOT', {}, daily); // nightly
    }
}
