# Integration boundaries

## Existing architecture

Browser: React + Vite. Identity and database: Supabase. Real-money storage uses PostgreSQL integer USD minor units (100 = USD 1). Original demos have no access to cash balances and use in-memory credits; refreshing resets them.

The original game catalog is code-owned in `src/lib/catalog.ts`. The existing Supabase catalog tables are secured and retained for future external provider game ingestion. In this version the provider page deliberately shows no connected provider. Adding rows alone does not create a working provider launch path.

## Provider launch

`supabase/functions/game-launch` validates a Supabase access token, then returns 503 until an actual adapter is implemented. A live implementation must:

- Obtain the user from the verified JWT, never a client-supplied player ID.
- Read the private immutable profile; validate KYC, age, email confirmation, exclusion, market eligibility and licence/product permissions.
- Enforce platform and provider activation; never launch cash games when disabled.
- Create an expiring provider session server-side; bind player, provider, approved game and USD currency.
- Call the provider's authenticated server launch endpoint. Keep credentials in Edge Function secrets.
- Validate provider URLs against an explicit HTTPS allowlist and return the launch URL.
- Reconcile launch failures and orphaned sessions; close sessions on exclusion.
  Each actual provider protocol must be implemented and tested separately. No placeholder launch URL or fictitious provider is exposed.

## Normalized wallet callback reference

One debit and one terminal credit OR refund per round. All amounts include returned stake where appropriate. Providers with multiple debits, partial wins, progressive jackpots, rollback-after-win or transfer wallets require a different reviewed adapter and expanded accounting model.

Environment secrets:

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (Edge Functions only)
- `PROVIDER_SLUG`, `PROVIDER_CALLBACK_SECRET` (one provider per deployed adapter)
- `ENABLE_PROVIDER_CALLBACK=true` only for a configured, verified adapter
- `APP_ORIGIN` for the browser launch endpoint
  No callback activation secrets are included in the repo.

Headers: `x-spindra-timestamp` (Unix seconds) and `x-spindra-signature` (hex HMAC-SHA256 of `timestamp + "." + exact_raw_body`). The handler validates the signature through Web Crypto, allows a five-minute delivery window, caps the streamed body at 16 KiB, validates input and calls a service-role-only database function.

Example body (test/staging only):

```json
{
  "event_id": "provider-unique-event",
  "session_id": "SERVER_SESSION_UUID",
  "round_id": "provider-round",
  "kind": "debit",
  "amount_minor": 100,
  "currency": "USD"
}
```

A win uses `kind:"credit"` with the full return, including the stake. A loss must finalize with a zero credit. A refund must equal the original stake. Retry with the same event ID and identical fields. A conflicting payload is rejected. A new event ID cannot settle a finalized round again. Debit checks include platform activation, allowed country, provider activation, verified KYC, confirmed email, exclusion, session expiry, daily loss limit and available funds. Outstanding rounds can settle after a shutdown or exclusion.

Database functions lock the player and wallet, write balances and events in one transaction, and apply unique provider/event IDs. UTC daily net loss is attributed to the wager's creation day and includes unsettled stakes. Ledger amounts have bounded integers safe for browser display.

This callback contract is a reference scaffold; it is not a turnkey adapter for any named provider. It needs rate limiting, protocol-specific error mapping, key rotation, network controls, delivery monitoring, reconciliation and multi-session/concurrency/load testing in a real Supabase staging environment.

## Crypto payments (future)

There is no deposit address generator, payment checkout, withdrawal execution or payment webhook in this version. Buttons do not suggest funds can be accepted.

A reviewed payment integration needs:

- Explicit asset/network pairs, address ownership, precision and integer/decimal handling per asset.
- Server-issued quotes and exchange-rate expiry when crediting the USD wallet.
- Authenticated payment notifications, unique chain/transaction/log identifiers and account mapping.
- Network confirmation thresholds, chain reorganization handling, sanctions/AML checks and suspicious-transaction review.
- Append-only deposit/withdrawal ledger and exact idempotency keys. Never credit based on a browser success message.
- Withdrawal reservation, limits, compliance checks, approvals, provider execution, failure release and reconciliation.
  The provider wallet function supports casino rounds only and must not be repurposed as an unauthenticated deposit endpoint.

## Original games

All 16 slots share four explicit reel-weight/paytable profiles. Their names, symbols, palettes, artwork and motion differ; they are not 16 independently certified mathematical games. The published theoretical RTP values derive exactly from the configured single-payline model. Blackjack, video poker and roulette also run locally.

Moving originals to cash play requires an authoritative game server with persistent round state and idempotent commands, audited RNG and game math, wallet reservations/settlement, reconnection recovery, exclusion/limit enforcement and certification appropriate to the selected market. Never trust client-generated outcomes, stake values or winnings for cash settlement.

## Verification limits

Automated tests run migrations against isolated PGlite PostgreSQL with mocked Supabase Auth roles/users. They verify SQL behavior and access restrictions, not Supabase hosted Auth delivery, Edge deployment, provider integrations, cryptographic certification or production concurrent performance.
