# Launch work remaining

The owner describes a planned licence and crypto payment integration. The exact licensing authority, licence number, licence scope and permitted countries must be verified and entered by the operator. No licence badge is shown while those are unknown.

This branch prepares the application and account/wallet foundation. It does not make the platform ready to accept real funds.

| Area                  | Current state                                                    | Required before cash launch                                                                          |
| --------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Frontend              | Playable demo lobby and 19 originals                             | Production HTTPS hosting and configured environment                                                  |
| Authentication        | Supabase flows implemented                                       | Apply migrations, enable confirmation, SMTP, abuse protection, session/security testing              |
| Accounts              | RLS-protected profiles and wallet reads                          | Operator support tooling, identity workflow and verified market eligibility                          |
| Licence / legal       | Prelaunch notices only                                           | Confirm operator/licence scope, publish approved terms, privacy, complaints and required disclosures |
| Original games        | Browser demos with tested rules                                  | Persistent server engine, audited RNG/math, approved testing/certification                           |
| Provider games        | Fail-closed launch endpoint and callback reference               | Contract, real protocol adapters, catalog ingestion and end-to-end staging tests                     |
| Crypto deposits       | Disabled                                                         | Reviewed custody/payment processor, network/asset support, confirmations, AML and reconciliation     |
| Withdrawals           | Disabled                                                         | Reserved funds, compliance and authorization workflow, processor integration, failure recovery       |
| Ledger                | Atomic casino round events and exact retry checks                | Deposit/withdrawal/adjustment accounting, independent reconciliation, immutable audit and backups    |
| Responsible play      | Demo limits/pause, account lower-only daily limits and exclusion | Market-specific controls, cooldowns for increases, monitoring and support operations                 |
| Security / operations | RLS tests, CI, updated dependencies                              | Independent security review, rate limits, monitoring/alerts, incident response, restore/load tests   |

Do not enable `real_money_enabled` by simply setting a flag. All applicable integrations and operational requirements must be verified first. The current provider launch handler deliberately refuses cash game launches even if the flag is changed.

The UI makes no claims of active licensing, guaranteed security certification, player counts, jackpots, instant withdrawals or live provider connectivity. Demo credits are clearly labelled as having no cash value.
