"use client";

/* Thin helpers for the three tables behind /plan, /profile and /dashboard.
   Row Level Security only ever returns the signed-in user's own rows. */

export async function getProfile(supabase, userId) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("life, goal, blocker")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data; // row object or null
}

/* A missing subscription row means Free. */
export async function getSubscription(supabase, userId) {
  if (!supabase) return "free";
  const { data, error } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.plan ?? "free";
}

export async function countSessionsThisMonth(supabase, userId) {
  if (!supabase) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // A GET (not head: true) so a missing table / RLS problem surfaces as a
  // real error instead of a silent null count.
  const { count, error } = await supabase
    .from("sessions")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth);
  if (error) throw error;
  return count ?? 0;
}