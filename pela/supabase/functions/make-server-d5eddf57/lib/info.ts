export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
export const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// turvalisem kui regex: võtab hostname'i esiosa
export const PROJECT_ID =
  (SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : "") ?? "";
