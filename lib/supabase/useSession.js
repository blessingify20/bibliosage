"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "./client";

/* The signed-in Supabase session.

   undefined -> still checking (show a spinner, not a redirect)
   null      -> logged out
   object    -> logged in, with .user (email, id, ...)

   Every change (login, logout, another tab) comes through the listener, so
   the navbar and the dashboard stay in sync without a page reload. */
export default function useSession() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSession(null);
      return undefined;
    }

    let alive = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setSession(data.session ?? null);
      })
      .catch(() => {
        if (alive) setSession(null);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        setSession(next ?? null);
      }
    );

    return () => {
      alive = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return session;
}
