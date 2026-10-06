"use client";

import { createClient } from "@supabase/supabase-js";

/* One browser client for the whole app.

   The two values are NEXT_PUBLIC_*, so Next.js bakes them into the bundle at
   build time. That is safe: the publishable (anon) key only carries the same
   access an anonymous visitor already has, and the session lives in this
   browser. A service_role or secret key must NEVER be given to this code.

   Returns null when the environment variables are missing (for example a
   fresh clone without a .env.local) so pages can show a friendly message
   instead of crashing. */
let cached = null;
let decided = false;

export function getSupabase() {
  if (decided) return cached;
  decided = true;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  cached = createClient(url, key);
  return cached;
}
