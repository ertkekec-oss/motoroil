# Boost Billing (Monetization v1)

## Overview
Periodya operates a multi-tenant B2B trade network where Escrow and Trust mechanisms drive secure transactions. As part of our monetization strategy (v1), we offer sellers the option to "Boost" their listings to gain additional visibility across the network.

To prevent exploitation and ensure fair play, Boost functionality is metered, quota-bound, and billed on a subscription or package basis. The Pilot Implementation allows controlled testing and iteration with select sellers. 

## Key Mechanisms
1. **Boost Plans**: Admins can define month-to-month subscription plans that allocate a set number of "Sponsored Impressions" per cycle. Plans specify price, currency, and strict quotas.
2. **Subscriptions**: Sellers subscribe to a Boost Plan. Upon activation, they receive predefined monthly impression quotas.
3. **Metering & Quotas**: 
   - Every time a sponsored seller's listing is displayed in a search or category list, an impression is logged in `DiscoveryImpression`.
   - Impressions are asynchronously collected and batched to increment daily usage via `BoostUsageDaily`.
   - The quota system intercepts the Ranking engine (`ranking.ts`): If a seller exhausts their quota, their listings seamlessly fall back to organic ranking, losing their sponsor multiplier until the next cycle or upon buying additional quotas.
4. **Operations & Ledger**:
   - Initial subscription billing writes deterministic entries to the immutable `LedgerEntry` system (from `SELLER_WALLET` to `BOOST_REVENUE`).
   - Idempotency mechanisms ensure no duplicate charging.

## Security & Anti-Gaming
- **Cold Start Fairness**: New listings temporarily receive minor boosts regardless of subscription to guarantee baseline traffic.
- **Trust Tier Limitations**: Only sellers matching high-trust tiers (Tier A/B) benefit substantially from boosts. Low-trust sellers (Tier C/D) face a multiplier cap at exactly `1.0x`—meaning they cannot purchase placement if they don't maintain network standards.
- **Interleaving**: Organic results are preserved. Sponsored listings are tightly interleaved up to a maximum density (e.g., 20% or 1 in every 5 results).

## Metrics & Observability
- All events interact with `FinanceOpsLog` and update daily aggregations.
- Boost Revenue constitutes its own metric, logged explicitly to report platform profitability independently from Escrow/Commission streams.

## Next Steps
In v2, moving toward fully self-service Checkout flows, letting sellers dynamically upgrade/downgrade their plans using the same internal billing primitives.
