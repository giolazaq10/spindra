# Spindra original cash games

The original slots, blackjack, Hold’em and roulette now have a server-side cash path. The website is cash-only: every playable game uses the authenticated USD wallet. There is no practice balance, reset control or mode selector. Cash outcomes use the published game math and cryptographic rejection-sampled RNG on the server. This implementation is not a third-party game/RNG certification.

## Installed pieces

- `cash-games` Edge Function validates the user's actual Supabase session.
- `commit_cash_game` atomically persists private round state, command responses and cash-ledger entries. Browser roles cannot call it or read decks/opponents' cards.
- One open table hand per account; monotonically increasing revisions prevent concurrent actions from changing the same state twice. Retrying the same request key returns its saved response.
- All 22 slots and European roulette settle immediately on the server; blackjack and poker persist across refreshes and page navigation.
- At 15 minutes, cleanup finishes blackjack by standing and completing the dealer. Poker folds and returns only uncommitted chips. Existing rounds can settle after a pause or self-exclusion; extra stakes and new rounds cannot.
- Cash and external-provider rounds share one UTC daily loss budget. Cash bets use USD minor units and the existing cash wallet. Maximum total stake per round defaults to $200.
- The existing NOWPayments deposit/withdrawal settings and balances are not changed by installing cash games.

## Location gateway (required before activation)

### Bolt Hosting setup

Keep the website and DNS on Bolt Hosting. The provided gateway is a separate small API on a Cloudflare `workers.dev` address; it does not require moving the domain or hosting to Cloudflare. Bolt's documented server functions do not establish a trusted country-metadata contract for this integration, so do not replace this gateway with browser-supplied country or forwarding headers. A Cloudflare account and a deployed Worker are required for this supplied adapter. No Worker has been deployed by the repository changes.

New wagers and additional blackjack stakes require a location assertion signed by an operator-controlled Cloudflare Worker. Direct calls to Supabase with forged country headers fail. Both the verified profile country and current gateway country must be explicitly allowed. The fixed excluded-country list includes AU, KM, FR, NL, ES, GB and US. The operator must also exclude FATF-blacklisted, sanctioned and other prohibited jurisdictions when choosing the positive allowlist.

1. Create a Cloudflare Worker using `integrations/cloudflare/cash-gateway.js`.
2. Set Worker variables `APP_ORIGIN` (the real frontend origin), `SUPABASE_URL` (`https://kjzwiprswcvyubbctmqb.supabase.co`), and `SUPABASE_ANON_KEY` (the public project key).
3. Generate a random secret of at least 32 characters. Add the same value as `CASH_GEO_SECRET` in the Cloudflare Worker's secrets and Supabase Edge Function secrets. Do not commit it, paste it in chat, or use a VITE_ variable for the secret.
4. Set frontend `VITE_CASH_GAME_URL` to the HTTPS Worker endpoint. Rebuild/redeploy the frontend. Only the URL is public.
5. In Bolt, configure the public `VITE_CASH_GAME_URL` build variable and republish the website. Keep `CASH_GEO_SECRET` only in Worker and Supabase server secrets.
6. Confirm the Worker receives genuine Cloudflare request country metadata. Test permitted, denied, unknown and unavailable-location cases. A missing or failed gateway must not permit a new wager. Unknown location still allows account reads and existing-hand settlement. IP country is not a substitute for any stronger location/VPN controls or compliance screening required by the operator.

The gateway signs the exact request body, authenticated user token, timestamp and country. An assertion expires after two minutes. Requests remain subject to account eligibility and idempotency on the backend.

References: [Bolt server functions](https://support.bolt.new/bolt-cloud/database/server-functions), [Cloudflare trusted request metadata](https://developers.cloudflare.com/workers/runtime-apis/request/), [workers.dev endpoints](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/).

## Operator activation

Sign in to `/admin`, verify account MFA, and select **cash games**. Enter the legal operator, issued licence details, and a reviewed list of approved ISO two-letter country codes. Confirm the release policy review and record an audit reason. Enabling is owner-only and requires the location-gateway secret. An empty allowlist, a listed excluded country or missing operator/licence fields blocks activation.

Operator details supplied for this project: `3-102-961387 SRL`, domain `betcoin.ag`, licence reference `ALSI-202605043-FI2`. Treat these as operator-supplied information, not independently certified licensing evidence. Confirm the registered domain, licence validity, approved markets, independent game certification, KYC/location/sanctions controls, bankroll and payout liquidity, operational monitoring and acceptance testing through the operator's release process before activating wagers.

User accounts still require verified adult identity, an immutable verified country, confirmed email, no exclusion, an active account, sufficient funds and available daily loss budget. Do not mark accounts verified merely to bypass the checks.

## Deployment and verification

Apply `20261016085611_authoritative_cash_rounds.sql` and `20261016090911_cash_round_cleanup.sql`, then deploy `cash-games` with its shared dependencies and generated `cash-engine.js` plus declaration file. The one-minute cleanup job uses the existing private worker key, not a browser token. Inspect Edge Function responses as well as cron SQL status.

Run `npm run cash:bundle` after engine/math changes; `npm run build` does this automatically. Keep active-round model compatibility when changing a deployed engine: pause new wagers and settle old rounds before replacing their model implementation.

Tests cover published slot payouts, hidden cards/decks, poker chip conservation, blackjack settlement, persistent commands and conflicts, eligibility/exclusions, blocked locations, RLS, duplicate returns and country-signature tampering. Tests are isolated fixtures, not live money transactions or a substitute for operator acceptance tests.

## Minimum stakes

Original cash games accept a $0.20 minimum. Normal stakes use $0.10 increments; poker hand buy-ins use $0.20 increments so both blinds stay in whole cents. Blackjack insurance can be half a main stake. Slot returns add the awards and round down once to a USD cent, so the displayed base RTP is an upper bound before cash rounding at small stakes. Dice also rounds winning returns down to cents.
