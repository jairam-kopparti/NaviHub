"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useUser } from "../../lib/useUser";
import { isAdminEmail } from "../../lib/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useUser();
  const [checkedAccess, setCheckedAccess] = useState(false);

  const hasAdminAccess = useMemo(() => isAdminEmail(user?.email), [user?.email]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/pages/signin?redirect=%2Fpages%2Fadmin");
      return;
    }

    if (!hasAdminAccess) {
      router.replace("/");
      return;
    }

    setCheckedAccess(true);
  }, [loading, user, hasAdminAccess, router]);

  if (loading || !checkedAccess) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex items-center justify-center">
        <Loader2 className="w-9 h-9 text-[#997e67] animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}