/*
# Enable cash play toggles

1. Changes
- Set platform_settings.real_money_enabled to true
- Set cash_game_config.enabled to true
2. Notes
- These are the operator-facing toggles that gate cash wagering.
- The edge function additionally requires a CASH_GEO_SECRET env var
  and per-request signed location headers for country verification.
*/

UPDATE platform_settings SET real_money_enabled = true WHERE id;
UPDATE cash_game_config SET enabled = true WHERE id;
