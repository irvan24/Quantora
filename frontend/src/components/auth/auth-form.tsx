"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { postAuthPath } from "@/lib/auth";
import { AppleIcon, GoogleIcon } from "@/components/icons";

const inputClass =
  "h-11 w-full rounded-[10px] border border-[#1E2228] bg-input px-3.5 text-[14.5px] text-[#ECECE8] outline-none placeholder:text-faint focus:border-[#3A4270] focus:bg-[#14171B]";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { login, register } = useAuth();
  const isSignup = mode === "signup";
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isSignup && !termsAccepted) {
      setError("Confirm you understand Quantora is not investment advice.");
      return;
    }

    setSubmitting(true);
    try {
      const user = isSignup
        ? await register({ firstName, email, password, termsAccepted })
        : await login(email, password);
      router.replace(postAuthPath(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[400px] py-10">
      <h1 className="text-[30px] font-light tracking-[-0.025em] text-[#ECECE8]">
        {isSignup ? "Create your account" : "Welcome back"}
      </h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
        {isSignup
          ? "Start with the basics. You can invest later — or never."
          : "Pick up where your thinking left off."}
      </p>

      <div className="mt-8 flex flex-col gap-2.5">
        <SocialButton
          label="Continue with Google"
          icon={<GoogleIcon />}
          onClick={() => setError("Email signup is available now. Google is coming next.")}
        />
        <SocialButton
          label="Continue with Apple"
          icon={<AppleIcon />}
          onClick={() => setError("Email signup is available now. Apple is coming next.")}
        />
      </div>

      <div className="my-6 flex items-center gap-3.5">
        <span className="h-px flex-1 bg-[#1A1E23]" />
        <span className="text-[11.5px] tracking-[0.1em] text-faint uppercase">or</span>
        <span className="h-px flex-1 bg-[#1A1E23]" />
      </div>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        {isSignup && (
          <label className="flex flex-col gap-2">
            <span className="text-[12.5px] font-medium text-muted">First name</span>
            <input
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Irvan"
              autoComplete="given-name"
              className={inputClass}
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="text-[12.5px] font-medium text-muted">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            className={inputClass}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center text-[12.5px] font-medium text-muted">
            <label htmlFor="password">Password</label>
            {!isSignup && (
              <button
                type="button"
                className="ml-auto font-normal text-link hover:text-link-hover"
                onClick={() => setError("Password reset isn’t available yet. Use the password you created.")}
              >
                Forgot?
              </button>
            )}
          </div>
          <div className="relative flex">
            <input
              id="password"
              required
              minLength={isSignup ? 8 : undefined}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              className={`${inputClass} pr-[74px]`}
            />
            <button
              type="button"
              className="absolute top-2 right-2 h-7 px-1.5 text-xs font-medium text-[#7C828B] hover:text-[#ECECE8]"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isSignup && <span className="text-xs text-faint">At least 8 characters.</span>}
        </div>

        {isSignup && (
          <label className="flex cursor-pointer items-start gap-[11px]">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-0.5 h-[15px] w-[15px] shrink-0 accent-[#4B57A8]"
            />
            <span className="text-[12.5px] leading-[1.55] text-[#7C828B]">
              I understand Quantora is an education and research tool, not investment advice.
            </span>
          </label>
        )}

        {error && <p className="text-[13px] leading-relaxed text-[#D7A3A3]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-1.5 h-[46px] rounded-full bg-accent text-[14.5px] font-semibold text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-7 text-xs leading-relaxed text-faint">
        By continuing you agree to our{" "}
        <a href="#terms" className="text-link hover:text-link-hover">
          Terms
        </a>{" "}
        and{" "}
        <a href="#privacy" className="text-link hover:text-link-hover">
          Privacy policy
        </a>
        .
      </p>
    </div>
  );
}

function SocialButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2.5 rounded-[10px] border border-[#1E2228] bg-input px-4 py-3 text-sm font-medium text-[#ECECE8] hover:bg-[#14171B]"
    >
      {icon}
      {label}
    </button>
  );
}

export function AuthSwitch({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";
  return (
    <div className="flex items-center justify-end gap-3.5 text-[13px] text-[#6C727B]">
      <span>{isSignup ? "Already have an account?" : "New to Quantora?"}</span>
      <Link
        href={isSignup ? "/login" : "/signup"}
        className="rounded-full border border-[#1E2228] bg-input px-4 py-2 text-[13px] font-semibold text-[#ECECE8] hover:bg-[#14171B]"
      >
        {isSignup ? "Sign in" : "Create account"}
      </Link>
    </div>
  );
}
