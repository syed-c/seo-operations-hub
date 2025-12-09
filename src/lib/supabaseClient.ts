import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Removed service role key from client-side code - this should only exist on server-side

function isValidHttpUrl(url?: string) {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

let supabase: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
} else if (!isValidHttpUrl(supabaseUrl)) {
  console.error("VITE_SUPABASE_URL is invalid. It must start with http(s)://");
} else {
  // Only log in development mode
  if (import.meta.env.DEV) {
    console.log("Creating Supabase client...");
  }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  // Removed success log to avoid exposing client status in production
}

// Removed admin client creation - this should only be done server-side

export { supabase };

export function ensureSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

// Removed ensureSupabaseAdmin function - admin operations should be done via server functions