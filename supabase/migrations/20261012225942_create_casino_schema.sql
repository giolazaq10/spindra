/*
# Create Spindra Casino database schema

This migration creates the core tables for the Spindra Casino platform:
providers, game_categories, games, and promotions. These tables are designed
to support future integration with real game provider APIs.

## New Tables

1. `providers` — game provider info (name, slug, logo, status)
2. `game_categories` — game type categories (Slots, Blackjack, etc.)
3. `games` — individual games linked to provider + category
4. `promotions` — promotional offers and bonuses

## Security

Prototype app with no sign-in. All data is intentionally public.
RLS enabled on every table with anon+authenticated full CRUD policies.
*/

-- ===== Providers =====
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_providers" ON providers;
CREATE POLICY "anon_select_providers" ON providers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_providers" ON providers;
CREATE POLICY "anon_insert_providers" ON providers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_providers" ON providers;
CREATE POLICY "anon_update_providers" ON providers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_providers" ON providers;
CREATE POLICY "anon_delete_providers" ON providers FOR DELETE TO anon, authenticated USING (true);

-- ===== Game Categories =====
CREATE TABLE IF NOT EXISTS game_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  icon text NOT NULL DEFAULT 'Coins',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_game_categories" ON game_categories;
CREATE POLICY "anon_select_game_categories" ON game_categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_game_categories" ON game_categories;
CREATE POLICY "anon_insert_game_categories" ON game_categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_game_categories" ON game_categories;
CREATE POLICY "anon_update_game_categories" ON game_categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_game_categories" ON game_categories;
CREATE POLICY "anon_delete_game_categories" ON game_categories FOR DELETE TO anon, authenticated USING (true);

-- ===== Games =====
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  provider_id uuid REFERENCES providers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES game_categories(id) ON DELETE SET NULL,
  image_url text,
  rtp text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'coming_soon', 'inactive')),
  tag text,
  players_online int NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_games" ON games;
CREATE POLICY "anon_select_games" ON games FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_games" ON games;
CREATE POLICY "anon_insert_games" ON games FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_games" ON games;
CREATE POLICY "anon_update_games" ON games FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_games" ON games;
CREATE POLICY "anon_delete_games" ON games FOR DELETE TO anon, authenticated USING (true);

-- ===== Promotions =====
CREATE TABLE IF NOT EXISTS promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  description text,
  badge text,
  icon text NOT NULL DEFAULT 'Gift',
  gradient text NOT NULL DEFAULT 'from-amber-500 via-orange-500 to-rose-500',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'scheduled', 'expired')),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_promotions" ON promotions;
CREATE POLICY "anon_select_promotions" ON promotions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_promotions" ON promotions;
CREATE POLICY "anon_insert_promotions" ON promotions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_promotions" ON promotions;
CREATE POLICY "anon_update_promotions" ON promotions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_promotions" ON promotions;
CREATE POLICY "anon_delete_promotions" ON promotions FOR DELETE TO anon, authenticated USING (true);

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_games_category_id ON games(category_id);
CREATE INDEX IF NOT EXISTS idx_games_provider_id ON games(provider_id);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_games_sort_order ON games(sort_order);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON game_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);

-- ===== Seed: Categories =====
INSERT INTO game_categories (name, slug, icon, sort_order) VALUES
  ('Slots', 'slots', 'Coins', 1),
  ('Live Casino', 'live-casino', 'Radio', 2),
  ('Roulette', 'roulette', 'Disc3', 3),
  ('Blackjack', 'blackjack', 'Spade', 4),
  ('Poker', 'poker', 'Diamond', 5),
  ('Jackpots', 'jackpots', 'Trophy', 6)
ON CONFLICT (slug) DO NOTHING;

-- ===== Seed: Providers =====
INSERT INTO providers (name, slug, description, status) VALUES
  ('NeonPlay', 'neonplay', 'Premium slots and arcade games with vibrant neon-themed graphics.', 'active'),
  ('Royal Studios', 'royal-studios', 'Classic table games and live dealer experiences with a luxury feel.', 'active'),
  ('MegaSpark', 'megaspark', 'High-volatility jackpot slots with massive progressive prize pools.', 'active'),
  ('Pragmatic Edge', 'pragmatic-edge', 'Award-winning slots and live casino games trusted by top operators worldwide.', 'pending'),
  ('Evolution Live', 'evolution-live', 'The industry leader in live dealer casino games and game shows.', 'pending')
ON CONFLICT (slug) DO NOTHING;

-- ===== Seed: Games =====
INSERT INTO games (title, slug, provider_id, category_id, image_url, rtp, status, tag, players_online, sort_order)
SELECT g.title, g.slug, p.id, c.id, g.image_url, g.rtp, g.status, g.tag, g.players_online, g.sort_order
FROM (VALUES
  ('Neon Reels', 'neon-reels', 'neonplay', 'slots', 'https://images.pexels.com/photos/29790831/pexels-photo-29790831.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '96.8%', 'active', 'HOT', 3421, 1),
  ('Royal Blackjack', 'royal-blackjack', 'royal-studios', 'blackjack', 'https://images.pexels.com/photos/36776646/pexels-photo-36776646.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '99.2%', 'active', 'NEW', 1876, 2),
  ('Lucky Spin Roulette', 'lucky-spin-roulette', 'royal-studios', 'roulette', 'https://images.pexels.com/photos/7594180/pexels-photo-7594180.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '97.3%', 'active', 'TOP', 2103, 3),
  ('Golden Fortune', 'golden-fortune', 'megaspark', 'slots', 'https://images.pexels.com/photos/29790832/pexels-photo-29790832.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '95.6%', 'active', 'JACKPOT', 5540, 4),
  ('Diamond Poker', 'diamond-poker', 'royal-studios', 'poker', 'https://images.pexels.com/photos/15793573/pexels-photo-15793573.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '98.4%', 'active', 'HOT', 1320, 5),
  ('Mega Slots Party', 'mega-slots-party', 'neonplay', 'slots', 'https://images.pexels.com/photos/29825627/pexels-photo-29825627.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '96.2%', 'active', 'NEW', 2890, 6),
  ('Live Dealer Royale', 'live-dealer-royale', 'royal-studios', 'live-casino', 'https://images.pexels.com/photos/7594314/pexels-photo-7594314.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '98.8%', 'active', 'LIVE', 980, 7),
  ('Ace High Cards', 'ace-high-cards', 'neonplay', 'live-casino', 'https://images.pexels.com/photos/269630/pexels-photo-269630.jpeg?auto=compress&cs=tinysrgb&h=650&w=940', '97.9%', 'active', 'TOP', 1560, 8)
) AS g(title, slug, provider_slug, category_slug, image_url, rtp, status, tag, players_online, sort_order)
JOIN providers p ON p.slug = g.provider_slug
JOIN game_categories c ON c.slug = g.category_slug
ON CONFLICT (slug) DO NOTHING;

-- ===== Seed: Promotions =====
INSERT INTO promotions (title, subtitle, description, badge, icon, gradient, status, sort_order) VALUES
  ('Welcome Bonus', '200% Match up to $1,000', 'Triple your first deposit instantly. No code needed — just sign up and play.', 'NEW PLAYERS', 'Gift', 'from-amber-500 via-orange-500 to-rose-500', 'active', 1),
  ('Free Spins Friday', '50 Free Spins Every Week', 'Log in on Fridays and claim your free spins on our featured slot of the week.', 'WEEKLY', 'Sparkles', 'from-cyan-400 via-blue-500 to-indigo-500', 'active', 2),
  ('Cashback Weekend', '20% Cashback on Losses', 'Play all weekend and get 20% of your net losses back every Monday morning.', 'WEEKEND', 'RefreshCw', 'from-pink-500 via-rose-500 to-red-500', 'active', 3)
ON CONFLICT DO NOTHING;
