
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// Mugavam nimi – teised failid impordivad seda
export const publicAnonKey = SUPABASE_ANON_KEY;

// Võta projekt ID URL-ist
export const projectId =
  SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1] ?? "";
