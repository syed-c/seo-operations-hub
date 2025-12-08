import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Service role key for admin operations (only use this on the server-side)
const supabaseServiceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined;

console.log("Supabase Config:", { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey });

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
  console.log("Creating Supabase client...");
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log("Supabase client created:", !!supabase);
}

// Create a service role client for admin operations
let supabaseAdmin: SupabaseClient | null = null;

if (supabaseServiceRoleKey) {
  console.log("Creating Supabase admin client...");
  supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey);
  console.log("Supabase admin client created:", !!supabaseAdmin);
}

export { supabase, supabaseAdmin };

export function ensureSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error("Supabase client is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}

export function ensureSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error("Supabase admin client is not configured. Check SUPABASE_SERVICE_ROLE_KEY.");
  }
  return supabaseAdmin;
}