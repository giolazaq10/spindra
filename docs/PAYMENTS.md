# Spindra payments setup

Backend installation is complete on project kjzwiprswcvyubbctmqb: all four migrations, authenticated wallet API, signed IPN handler, payout worker and one-minute scheduler are installed. The sole existing account has the owner role. Payments are paused and no funds have been moved. Merge the GitHub changes to publish the wallet and admin frontend; then complete the secrets and testing steps below. Do not reapply installed migrations manually.

The implementation uses NOWPayments Custody, reusable deposit addresses and a USD cash ledger. Deposits and withdrawals start paused. Original games remain practice games; enabling payment controls does not enable cash wagering.

## 1. Supabase secrets

Open [Edge Function Secrets](https://supabase.com/dashboard/project/kjzwiprswcvyubbctmqb/functions/secrets). Add these values there, never in Bolt frontend variables, GitHub, chat or a VITE_ variable:

| Secret                                   | Value / purpose                                                                                           |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| NOWPAYMENTS_API_KEY                      | Merchant API key (already added; verify it belongs to this custody merchant)                              |
| NOWPAYMENTS_IPN_SECRET                   | IPN secret generated in NOWPayments merchant settings                                                     |
| NOWPAYMENTS_EMAIL                        | Merchant login email used by payout authentication                                                        |
| NOWPAYMENTS_PASSWORD                     | Merchant login password                                                                                   |
| NOWPAYMENTS_2FA_SECRET                   | Merchant TOTP secret for provider payout verification; preserve provider 2FA                              |
| NOWPAYMENTS_OUTCOME_CURRENCY             | Exact merchant settlement ticker, e.g. a confirmed treasury coin/network, not an arbitrary display symbol |
| NOWPAYMENTS_CUSTODY_CONFIRMED            | `true` after custody approval                                                                             |
| NOWPAYMENTS_REUSABLE_ADDRESSES_CONFIRMED | `true` after provider confirmation for the enabled networks                                               |
| APP_ORIGIN                               | Production website origin, e.g. `https://your-spindra-domain.example`                                     |

Supabase supplies SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to Edge Functions. Never expose the service-role key to the browser. Frontend uses only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

## 2. NOWPayments configuration

Enable intended coins and networks in merchant currency settings. Spindra displays its 21 configured networks even while payments are paused or provider availability cannot be checked. Only networks confirmed enabled and available in your merchant account can create payment routes. The catalog shows a clear availability status. USDT and USDC networks have separate addresses. XRP, Stellar and other memo-based networks require the exact memo/tag displayed with the address.

Set the IPN callback to:

`https://kjzwiprswcvyubbctmqb.supabase.co/functions/v1/nowpayments-ipn`

Each created deposit payment and payout also specifies this callback. Settle deposits into the exact NOWPAYMENTS_OUTCOME_CURRENCY. Wallet credit is the confirmed net settlement converted to USD at reconciliation time, rounded down to cents; it is not an invoice amount or an unconfirmed transaction. Conversion and provider/network fees affect the credited amount.

Verify reusable payment behavior with NOWPayments for every enabled network: later deposits must create independently identifiable payment records (parent_payment_id pointing to the stored original payment). A payment ID is credited once. If the provider instead reports cumulative totals under one ID, do not enable that network until its adapter is changed to reconcile individual deposits. Confirm minimum-sized address generation remains valid for future arbitrary deposits and that expired initial invoices do not expire the reusable route.

Confirm custody payout access, authorized destinations and provider-required IP allowlisting. Supabase Edge Functions do not guarantee a single static outbound IP. If NOWPayments requires a static source, run the wallet worker through approved fixed egress or a dedicated worker with that egress before enabling payouts. Do not disable 2FA or IP protections to work around this. Direct worker preflight failures enter review; they do not silently bypass provider controls.

Keep enough custody balance and fee reserve for payouts. No actual funds are needed to install the system; use a separate sandbox project/merchant for provider tests. NOWPAYMENTS_SANDBOX=true selects the sandbox API, but sandbox and live data must never share a ledger or stored addresses.

## 3. Backend installation

Apply migrations in order after the original Bolt casino schema:

1. `20261013000100_platform_foundation.sql`
2. `20261013000200_crypto_wallet.sql`
3. `20261013000300_payment_worker.sql`
4. `20261013000400_payment_eligibility.sql`

Deploy `wallet-api`, `nowpayments-ipn`, `wallet-worker`, and the `crypto-deposit` compatibility endpoint, including `_shared` dependencies and `deno.json`. These endpoints implement their own authentication: validated user JWT, signed provider webhook, or private worker key. JWT gateway verification is disabled for these endpoints so provider webhooks and the scheduled worker can reach their own authentication checks.

Configure the scheduled worker endpoint using the service-role/SQL console:

```sql
select public.configure_payment_worker('https://kjzwiprswcvyubbctmqb.supabase.co/functions/v1/wallet-worker');
```

The migration schedules a one-minute cron job and generates a private random worker key. No worker key is exposed to the frontend. Check cron.job_run_details, net._http_response and Edge Function logs for errors; the cron invocation itself succeeding does not prove the HTTP worker succeeded. HTTP submission continues asynchronously after SQL commits.

## 4. Owner account and dashboard

The migration gives owner access to the sole existing registered account once. It grants nothing automatically to later registrations. Sign in to that account, visit `/account`, set up/verify the authenticator, then visit `/admin` and Refresh dashboard. Account two-factor security is separate from the merchant's NOWPayments TOTP.

Dashboard controls: player suspension and manual identity review, verified DOB/country, auditable cash adjustments, admin roles (last owner protected), asset/network switches, deposit/payout pause switches, automation threshold, daily withdrawal limits, queued payout approval/cancellation, uncertain payout/address reconciliation, provider integration switches, immutable cash ledger and admin audit. Snapshot lists are bounded to the latest 100 players/deposits/withdrawals and 150 cash entries; database exports remain available in Supabase for older records.

The current owner's legacy profile may lack DOB/country and remains KYC pending. Record verified information after actual identity review. Do not mark users verified merely to bypass checks. Withdrawals require adult verified profile, active account, confirmed email, sufficient cash and a session verified with two-factor authentication.

Defaults: automatic processing up to $100 per request, $500 daily per user (UTC). The owner can edit these. Larger requests enter review. Pausing prevents new address creation and payout submission/verification; existing deposit addresses can still receive funds and verified receipts continue to credit.

## 5. Test before activation

In an isolated sandbox/test merchant:

- Sign in with two users; each receives different addresses. Returning to the same user/network returns exactly the same address and memo.
- Send two different deposit amounts to one reusable route. Verify distinct provider payment IDs, completed status, correct net USD credits and two ledger entries. Replaying each signed webhook must not credit twice.
- Test wrong signatures, wrong currency/address/memo, unconfirmed payment states and provider outages. No cash credit should occur.
- Create a withdrawal with a network/address/memo, review live fees and the expiring quote, then confirm with account MFA. Repeated confirmation must reserve cash once.
- Check normal dealer-independent cash controls: insufficient funds, expired quote, suspended or unverified account, daily limit, over-threshold review.
- Confirm successful provider payout marks finished; confirmed provider failure refunds once. A lost creation response must become submission_unknown, retain its reserve and never automatically resend.
- Confirm pause blocks new payouts and verification. Reconcile unknown submissions by finding their external ID in NOWPayments, supplying the provider payout ID, and letting the backend verify destination, network, amount and correlation. Never blindly submit a replacement payout.
- Cancel only queued/review requests before provider submission; they refund once. Already submitted/uncertain requests cannot be locally cancelled.

Enable deposits and withdrawals independently from `/admin` Settings only after secrets, provider approval, egress, tests and operator requirements are complete. Missing secrets block activation. Minimum deposits and withdrawals are fetched live; Spindra adds no arbitrary deposit floor. Extremely small deposits may still be below provider/network minimums.

## Provider references

- [Permanent deposit addresses](https://nowpayments.io/blog/permanent-deposit-address)
- [API endpoint reference](https://nowpayments.zendesk.com/hc/en-us/articles/21345824322717-API-and-endpoint-description)
- [IPN signatures](https://nowpayments.zendesk.com/hc/en-us/articles/21395546303389-IPN-and-how-to-setup)
- [Official SDK](https://github.com/NowPaymentsIO/nowpayments-sdk-nodejs)
