"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useSession from "./useSession";

/* The session for pages that must only show signed-in users (/plan, /profile,
   /dashboard). Returns undefined while checking, redirects to /login when
   logged out, and returns the session object when signed in. */
export default function useRequireAuth() {
  const router = useRouter();
  const session = useSession();

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  return session;
}