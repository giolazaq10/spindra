import { createClient } from "@supabase/supabase-js";

export const authConfigured = Boolean(
  import.meta.env?.VITE_SUPABASE_URL && import.meta.env?.VITE_SUPABASE_ANON_KEY,
);
const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL || "https://unconfigured.invalid";
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY || "unconfigured";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
