# Spindra

React/Vite casino preparation platform, retaining the Bolt + Supabase architecture.

## Included

- Dedicated sign-in, registration, email confirmation redirect and password recovery pages using Supabase Auth.
- Protected account page with cash wallet, verification status and transaction history.
- Original Bolt homepage, navigation, typography, colors and promotional layouts retained.
- 16 original slot themes with five reels, three rows, ten paylines, staggered stops, faceted symbol artwork and animated winning lines across four published math profiles, plus animated single-deck blackjack, Jacks or Better video poker with an in-game paytable and European roulette with a number board and result history.
- Free session-only demo wallet, round history, demo loss limits and session pause.
- Supabase migration for private player data, server-owned cash balances, atomic wallet events, idempotent provider callbacks, account loss limits and 30-day exclusion.
- Responsive lobby with categories, search, sort, original artwork, reduced-motion support and accessible controls.
- Automated game math, exhaustive poker-hand and PostgreSQL wallet/RLS tests.

## Local development

Use Node 22.12+ (CI uses Node 22).

```sh
npm ci
cp .env.example .env
npm run dev
```

Copy the existing Bolt project's public Supabase URL and anon/publishable key into `.env` or the hosting environment. Never use a service-role key in a `VITE_` variable. An unconfigured build remains fully browsable with demos; account requests show an explicit setup message.

```sh
npm run typecheck
npm test
npm run build
```

## Supabase setup

1. Back up your project and apply migrations in a staging project first.
2. If the original Bolt migration is already applied, apply only `supabase/migrations/20261013000100_platform_foundation.sql`. On a fresh project, apply both migrations in timestamp order.
3. The new migration removes anonymous/authenticated catalog writes, deactivates fictitious provider/game seed rows and expires prototype promotions. Existing users are provisioned with zero cash and pending verification; their editable Auth metadata is not trusted for identity.
4. Enable email confirmation, configure a production SMTP sender, and set your Site URL and permitted redirects: `https://YOUR_DOMAIN/auth/callback` and `https://YOUR_DOMAIN/reset-password`. Include equivalent localhost redirects only in development.
5. Deploy `game-launch` and, when a reviewed provider adapter exists, `provider-callback`. See [integration contract](docs/INTEGRATIONS.md).
6. Leave `platform_settings.real_money_enabled=false`. No cash activation is performed by this change.

The registration trigger enforces an adult date of birth and prelaunch terms version, provisions a private player profile, and creates a USD wallet with zero balance. This is an age declaration, not verified age/KYC.

## Hosting / Bolt

Import or pull the feature branch in Bolt, keep the existing Supabase environment values, install dependencies and build. SPA fallbacks are included for Netlify-style hosting and Vercel; other hosts must serve `index.html` for application routes such as `/register` and `/game/solar-vault`.

Do not expose the Vite dev server as production hosting. Deploy the generated `dist/` assets through your existing host with HTTPS. No replacement hosting project or automatic deployment is created by this repository change.

## Launch status

This is a **tested preparation foundation, not a launch-ready cash casino**. Provider games are not the only remaining work. The stated licence and future crypto payments are not connected or verified. Original game engines are browser demos and cannot place cash bets.

See [launch requirements](docs/LAUNCH.md) for provider integration, server-authoritative original games, crypto payment processing, identity/age verification, licensing/market restrictions, legal documents, security audits, reconciliation and operational controls.

No funds, live database schema or production hosting configuration were changed while developing this branch.
