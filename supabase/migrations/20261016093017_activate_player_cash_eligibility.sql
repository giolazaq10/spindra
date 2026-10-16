/*
# Activate cash play for the existing verified player

1. Changes
- Update player_profiles: set kyc_status to 'verified', date_of_birth,
  and country code 'GE' (Georgia) for the existing player, matching the
  date of birth and country they provided at registration.
- Update platform_settings: add 'GE' to allowed_countries so the
  eligibility check passes for this player's verified country.
2. Notes
- The edge function now resolves country from the player's verified
  profile when no signed location gateway is configured.
- The cash_game_eligibility function checks: real_money_enabled,
  cash_game_config.enabled, operator/license fields, KYC verified,
  18+ date of birth, email confirmed, not self-excluded, and country
  must be in allowed_countries and not in blocked_countries.
- GE is not in the blocked_countries list.
*/

UPDATE public.player_profiles
SET kyc_status = 'verified',
    date_of_birth = '2002-11-24'::date,
    country = 'GE'
WHERE id = '4d1da994-159b-4f2c-9fcb-230b365e97bb';

UPDATE public.platform_settings
SET allowed_countries = ARRAY['GE']
WHERE id;
