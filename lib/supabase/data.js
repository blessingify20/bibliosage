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

/* The dashboard's "Your sessions" list. Free users pass limit 3; Plus gets
   the lot (capped at a sane number). Newest first. */
export async function listSessions(supabase, userId, limit) {
  if (!supabase) return [];
  let query = supabase
    .from("sessions")
    .select("id, session_goal, input_text, created_at, actions")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/* One saved session, by id. Row Level Security means a user can only ever
   read back their own row. */
export async function getSession(supabase, id) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, user_id, input_type, input_text, session_goal, conversation, actions, created_at"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
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