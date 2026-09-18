"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { postAuthPath } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) {
      return;
    }
    router.replace(user ? postAuthPath(user) : "/login");
  }, [ready, user, router]);

  return <div className="min-h-screen bg-background" />;
}
