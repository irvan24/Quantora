"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setDevToken(null);
    try {
      const result = await requestPasswordReset(email);
      setMessage(
        "If an account exists for this email, a reset link would be sent. Check your inbox in production."
      );
      if (result.resetToken) {
        setDevToken(result.resetToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2228] bg-card p-8">
        <h1 className="text-2xl font-light text-[#ECECE8]">Reset password</h1>
        <p className="mt-2 text-sm text-muted">Enter your email. We never confirm whether it exists.</p>
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-[10px] border border-[#1E2228] bg-input px-3.5 text-sm text-[#ECECE8]"
            placeholder="Email"
          />
          {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}
          {message ? <p className="text-[13px] text-muted">{message}</p> : null}
          {devToken ? (
            <p className="rounded-lg bg-[#14171B] p-3 text-[12px] text-dim break-all">
              Dev reset token:{" "}
              <Link href={`/reset-password?token=${encodeURIComponent(devToken)}`} className="text-link">
                use this link
              </Link>
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="h-11 rounded-[10px] bg-cta text-sm font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <Link href="/login" className="mt-6 inline-block text-sm text-link hover:text-link-hover">
          Back to login
        </Link>
      </div>
    </div>
  );
}
