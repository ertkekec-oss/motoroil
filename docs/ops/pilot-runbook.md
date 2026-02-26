# Periodya Pilot Launch Runbook

This runbook describes the administrative steps, system safety limits, and monitoring practices designed specifically for the Pilot Launch Phase (5-10 Tenants).

## 1. Activation Steps

To move a sub-merchant into the Pilot group:
1. Ensure their KYC and IBAN (PayoutDestination) are verified (`status='VERIFIED'`).
2. Run the `activate-pilot` admin endpoint to place them into the Pilot Cohort:
   `POST /api/admin/rollout/tenant/:tenantId/activate-pilot`
    - *Side effects*: Automatically sets `PILOT_MODE=true` on the tenant, ensures `ESCROW_ENABLED=true` globally for them, and applies a strict `holdDaysOverride` (+3 days safety hold) to prevent early cash-outs while we monitor logic.

## 2. Risk Cap Guidelines

To minimize real-world pilot financial risk, enforce these bounds dynamically without redeploying:
- **GMV Limit:** Soft cap at e.g., 50,000 TRY. `POST /api/admin/rollout/tenant/:tenantId/set-risk-caps { "maxDailyGmv": 50000 }`
- **Single Order Cap:** Limit single transactions to e.g., 10,000 TRY. `maxSingleOrderAmount: 10000`
- **Payout Limit:** Limit maximum batch transfers per day. `maxDailyPayout: 25000`

Operations will `WARNING` in `FinanceOpsLog` if these fail, protecting the system from infinite scaling abuse by an anomalous pilot tenant.

## 3. Incident Rollback Flow (Kill Switches)

If a Pilot Tenant is behaving maliciously, generating extreme refunds or exposing an integration gap:
1. **Pause Escrow** (stops them from receiving new orders via escrow):
   `POST /api/admin/rollout/tenant/:tenantId/pause-escrow`
2. **Pause Payout** (freezes funds already in ledger from being queued to Iyzico):
   `POST /api/admin/rollout/tenant/:tenantId/pause-payout`
3. **Emergency Resume** (if false alarm):
   `POST /api/admin/rollout/tenant/:tenantId/resume-all`

All switches are idempotent and log to both Ops and Audit trails.

## 4. Suggested First 7-Day Monitoring Checklist

1. Check `GET /api/admin/ops/health` daily:
   - Verify `pilotActiveTenantCount` equals expected signed pilots.
   - Verify `pilotPausedTenantCount` is 0 unless manually suspended.
   - Check `pilotDailyGmvTotal` to see holistic usage compared to risk thresholds.
2. Monitor Cohorts:
   - Call `GET /api/admin/metrics/cohorts/daily` and review `BETA_GROUP_1` or `PILOT` stats to isolate beta findings.
3. Feature Toggles:
   - Wait 3 days before enabling `DYNAMIC_RELEASE_ENABLED` per-tenant (`POST /api/admin/rollout/tenant/:tenantId/set-feature`). Use initial explicit hold times.
4. Alerts:
   - Make sure no `SINGLE_ORDER_LIMIT_EXCEEDED` warnings are firing maliciously in Ops logs.
