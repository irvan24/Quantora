"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Pencil } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { displayName, initials, type AuthUser } from "@/lib/auth";
import { changePassword, deleteAccount, updateProfile } from "@/lib/user";

const inputClass =
  "w-full rounded-[10px] border border-[#1E2228] bg-input px-3.5 py-2.5 text-[14px] text-[#ECECE8] outline-none placeholder:text-faint focus:border-[#3A4270]";

export function SettingsView({ user }: { user: AuthUser }) {
  const router = useRouter();
  const { logout, updateUser } = useAuth();

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-10 px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <h1 className="text-[34px] font-light tracking-[-0.02em] text-[#ECECE8]">Settings</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted">Manage your account and how you sign in.</p>
      </header>

      <AccountSection user={user} onSaved={updateUser} />
      <SecuritySection />

      <Section title="Your journey" body="Revisit the questions that shape your plan.">
        <Link
          href="/plan/edit"
          className="flex items-center gap-2 text-[13.5px] font-medium text-link hover:text-link-hover"
        >
          Edit your investor profile
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </Section>

      <Section title="Session" body="Sign out of Quantora on this device.">
        <button
          type="button"
          className="text-[13.5px] font-medium text-link hover:text-link-hover"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Sign out
        </button>
      </Section>

      <DangerZone />
    </div>
  );
}

function Section({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[#1E2228] bg-card px-6 py-5">
      <h2 className="text-[15px] font-semibold text-[#ECECE8]">{title}</h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{body}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AccountSection({
  user,
  onSaved,
}: {
  user: AuthUser;
  onSaved: (patch: Partial<AuthUser>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberSince = formatDate(user.createdAt);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const saved = await updateProfile(firstName, lastName);
      onSaved(saved);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#1E2228] bg-card px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1A1E26] text-[14px] font-semibold tracking-wide text-[#BDC3CB]">
            {initials(user)}
          </div>
          <div>
            <div className="text-[15px] font-semibold text-[#ECECE8]">{displayName(user)}</div>
            <div className="text-[13px] text-dim">{user.email}</div>
          </div>
        </div>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-dim hover:bg-[#1A1D22] hover:text-[#ECECE8]"
          >
            <Pencil size={13} strokeWidth={1.8} />
            Edit
          </button>
        ) : null}
      </div>

      {memberSince ? <p className="mt-4 text-[12.5px] text-dim">Member since {memberSince}</p> : null}

      {editing ? (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 border-t border-[#1A1D22] pt-5">
          {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}
          <div className="flex flex-wrap gap-3">
            <input
              className={`${inputClass} flex-1`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              maxLength={100}
              required
            />
            <input
              className={`${inputClass} flex-1`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              maxLength={100}
              required
            />
          </div>
          <p className="text-[12px] text-faint">Your email address can’t be changed here.</p>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-[10px] bg-cta px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setFirstName(user.firstName);
                setLastName(user.lastName ?? "");
                setError(null);
              }}
              className="text-[13.5px] font-medium text-dim hover:text-[#ECECE8]"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("The new passwords don’t match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#1E2228] bg-card px-6 py-5">
      <h2 className="text-[15px] font-semibold text-[#ECECE8]">Password</h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
        Changing your password signs you out everywhere else.
      </p>

      {done ? (
        <p className="mt-4 text-[13px] text-[#8BC4A8]">Password updated. Other sessions have been signed out.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-4 flex max-w-[420px] flex-col gap-3">
          {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}
          <input
            type="password"
            className={inputClass}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            autoComplete="current-password"
            required
          />
          <input
            type="password"
            className={inputClass}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <input
            type="password"
            className={inputClass}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-[10px] bg-cta px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-cta-hover disabled:opacity-60"
          >
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      )}
    </section>
  );
}

function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await deleteAccount(password);
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete your account.");
      setSaving(false);
    }
  }

  return (
    <section className="rounded-xl border border-[#3A2A2A] bg-[#150F0F] px-6 py-5">
      <h2 className="text-[15px] font-semibold text-[#DCA9A9]">Delete account</h2>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">
        Permanently deletes your access. This can’t be undone from the app — contact support if you change your mind.
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-[10px] border border-[#4A2E2E] px-4 py-2 text-[13.5px] font-medium text-[#DCA9A9] hover:bg-[#1F1414]"
        >
          Delete my account
        </button>
      ) : (
        <form onSubmit={onDelete} className="mt-4 flex max-w-[420px] flex-col gap-3">
          {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}
          <label className="text-[13px] text-muted">Confirm your password to delete your account.</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-[10px] bg-[#7A3B3B] px-4 py-2 text-[13.5px] font-semibold text-white hover:bg-[#8A4747] disabled:opacity-60"
            >
              {saving ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setPassword("");
                setError(null);
              }}
              className="text-[13.5px] font-medium text-dim hover:text-[#ECECE8]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date);
}
