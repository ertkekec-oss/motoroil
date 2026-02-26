# Periodya: Escrow & Finance Operations Runbook

This runbook defines operational processes, schedules, and manual commands for administering the FIN-2B/FIN-2B.1 infrastructure.

## 1. Cron Schedules
These cron jobs must be mapped to physical runners (e.g. Vercel Cron, AWS EventBridge) to execute `POST /api/admin/ops/run/*`.

| Job | Frequency | Cron Expression | Endpoint | Batch Size |
|---|---|---|---|---|
| Payout Outbox | Every 1m | `* * * * *` | `/api/admin/ops/run/outbox` | 50 |
| Webhook Process | Every 1m | `* * * * *` | (External Webhook) | 200 |
| Reconcile Pull | Every 5m | `*/5 * * * *` | `/api/admin/ops/run/reconcile-pull` | 100 |
| Stuck Repair | Every 15m | `*/15 * * * *` | `/api/admin/ops/run/repair` | 200 |
| Sentinel Hourly | Every 60m | `0 * * * *` | `/api/admin/ops/run/sentinel` | Recent |
| Sentinel Daily | Daily (02:00) | `0 2 * * *` | `/api/admin/ops/run/sentinel` | Full |

---

## 2. Daily Checks (Health Pulse)

Use `GET /api/admin/ops/health` to verify normal state:
- **`payoutOutboxPending`**: Should naturally fluctuate according to volume, but not continuously climb.
- **`payoutOutboxSendingStuck`**: Expected `0`.
- **`providerPayoutSentStuck10m`**: Expected `0`.
- **`integrityAlertsCriticalOpen`**: Expected `0`.

---

## 3. Incident Playbooks

### Incident: `FINALIZE_MISSING` Spike
**Symptom**: Alerts with severity CRITICAL for missing finalize.
**Meaning**: A payout succeeded at the provider, but the ledger was not finalized.
**Action**: 
1. `GET /api/admin/ops/health` to identify impacted `providerPayoutId`s.
2. Force finalize them manually:
```bash
POST /api/admin/ops/payouts/{providerPayoutId}/force-finalize
```
3. Acknowledge and Resolve the alerts via `/api/admin/ops/alerts/{alertId}/ack` and `/resolve`.

### Incident: Outbox stuck `SENDING`
**Symptom**: `maxOutboxAgeMinutes` is > 15m and `payoutOutboxSendingStuck` > 0.
**Meaning**: The application crashed precisely between sending to the provider and getting an immediate response.
**Action**: 
1. Usually self-healed by Stuck Repair job.
2. If stuck persistently, manually rerun:
```bash
POST /api/admin/ops/payouts/{providerPayoutId}/rerun-outbox
```

### Incident: `SENT` stuck without webhook
**Symptom**: `providerPayoutSentStuck10m` > 0.
**Meaning**: The provider never dispatched the webhook, or the signature failed.
**Action**:
1. Self-heals via Reconcile Pull worker. 
2. Safely force reconcile manually if needed:
```bash
POST /api/admin/ops/payouts/{providerPayoutId}/force-reconcile
```

### Incident: `LEDGER_UNBALANCED`
**Symptom**: Sentinel raises CRITICAL `LEDGER_UNBALANCED` alert.
**Meaning**: Double-entry accounting integrity breached. Wait for immediate escalation.
**Action**:
1. Isolate the exact LedgerGroup.
2. Verify all references. DO NOT attempt automated repair. Notify Senior Engineering directly.

### Incident: Quarantining a Suspicious Payout
If you see fraudulent behavior:
```bash
POST /api/admin/ops/payouts/{providerPayoutId}/quarantine
{ "reason": "Suspected fraud" }
```
This forces the payout to a `QUARANTINED` status and fails any outbox tasks indefinitely.

---

## 4. Manual Commands Reference (API Only)
> All requests require Platform Admin Session context. No UI exists.

**Re-run Outbox**
```http
POST /api/admin/ops/payouts/:id/rerun-outbox
```

**Force Reconcile**
```http
POST /api/admin/ops/payouts/:id/force-reconcile
```

**Force Finalize**
```http
POST /api/admin/ops/payouts/:id/force-finalize
```

**Quarantine**
```http
POST /api/admin/ops/payouts/:id/quarantine
Content-Type: application/json

{ "reason": "fraud" }
```

**Ack/Resolve**
```http
POST /api/admin/ops/alerts/:id/ack
POST /api/admin/ops/alerts/:id/resolve
```
