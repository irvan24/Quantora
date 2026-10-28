"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { resetPassword } from "@/lib/auth";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      setError("Missing reset token.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token, password);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-[#1E2228] bg-card p-8">
      <h1 className="text-2xl font-light text-[#ECECE8]">Choose a new password</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 rounded-[10px] border border-[#1E2228] bg-input px-3.5 text-sm text-[#ECECE8]"
          placeholder="New password"
        />
        <p className="text-[12px] text-dim">At least 8 characters, with a letter and a number.</p>
        {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="h-11 rounded-[10px] bg-cta text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Update password"}
        </button>
      </form>
      <Link href="/login" className="mt-6 inline-block text-sm text-link hover:text-link-hover">
        Back to login
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
