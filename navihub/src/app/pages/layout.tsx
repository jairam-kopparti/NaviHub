"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

// 📝 Update this list with the Supabase UUIDs of users 
// who are allowed to access the restricted pages.
const ALLOWED_UUIDS = [
  "83f18768-6f8d-4b74-99a5-837282b8e3b7",
  "e02c438a-6833-4e37-914d-9afdc194fe7c",
  "210ede71-99d1-4ac6-aed1-3ee778f7a262",
  "cba015b2-9fb2-4d97-90a3-7097b1eae469"
];

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Bypass protection entirely on the local development server by defaulting to true
  const isDev = process.env.NODE_ENV === "development";
  const [isAuthorized, setIsAuthorized] = useState<boolean>(isDev);

  useEffect(() => {
    if (isDev) return;

    // Let unauthenticated users access the sign-in and sign-up pages natively
    const isPublicPage = pathname === "/pages/signin" || pathname === "/pages/signup";

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (isPublicPage) {
        setIsAuthorized(true);
        return;
      }

      if (!session) {
        // Not logged in -> Redirect to home page
        router.push("/");
        return;
      }

      const userId = session.user.id;
      
      if (ALLOWED_UUIDS.includes(userId)) {
        setIsAuthorized(true);
      } else {
        // Logged in but NOT in the allowed list -> Redirect to home page
        router.push("/");
      }
    };

    checkAuth();

    // Listen for state changes (e.g. signing out or logging in on another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (pathname === "/pages/signin" || pathname === "/pages/signup") return;
      
      if (!session || !ALLOWED_UUIDS.includes(session.user.id)) {
        router.push("/");
      } else {
        setIsAuthorized(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, isDev]);

  // Prevent flash of page content while checking permissions
  if (!isAuthorized && pathname !== "/pages/signin" && pathname !== "/pages/signup") {
    // Empty return briefly to hide the page content while redirecting
    return <div className="min-h-screen grid items-center justify-center">Verifying access...</div>;
  }

  return <>{children}</>;
}
