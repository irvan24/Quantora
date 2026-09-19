"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useAuth } from "@/components/auth/auth-provider";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="min-h-screen bg-[#0D0F12]" />;
  }

  return <OnboardingWizard firstName={user.firstName} />;
}
