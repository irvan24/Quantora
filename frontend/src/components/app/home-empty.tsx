"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowIcon } from "@/components/icons";
import { type AuthUser, displayName } from "@/lib/auth";
import { homeModel, type HomeModel } from "@/lib/home";
import { getOnboarding } from "@/lib/onboarding";

export function HomeDashboard({ user }: { user: AuthUser }) {
  const [model, setModel] = useState<HomeModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getOnboarding();
        if (!cancelled) {
          setModel(homeModel(profile));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load your plan.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const firstLesson = model?.lessons[0] ?? null;

  return (
    <div className="flex w-full max-w-[1420px] flex-col gap-5 px-4 py-8 sm:px-10 sm:py-[38px]">
      <div className="flex flex-col gap-[22px]">
        <div>
          <div className="text-xs font-medium tracking-[0.09em] text-dim uppercase">{today}</div>
          <h1 className="mt-3 text-[34px] font-light tracking-[-0.02em] text-[#ECECE8] leading-[1.15]">
            Welcome, {displayName(user)}.
          </h1>
          <p className="mt-[11px] text-[15.5px] text-muted">
            Your plan is written. Nothing needs monitoring yet — that starts with your first thesis.
          </p>
        </div>

        {error ? <p className="text-[13px] text-[#D7A3A3]">{error}</p> : null}

        <div className="flex flex-wrap gap-4">
          <StatCard
            label="Plan"
            value={loading ? "…" : model?.plan?.value}
            meta={model?.plan?.meta || "Complete onboarding to write your starting plan."}
            empty={!loading && !model?.plan}
            dot={!loading && Boolean(model?.plan)}
          />
          <StatCard
            label="Discipline"
            value="Not started"
            meta="Begins with your first decision"
            empty
          />
          <StatCard
            label="Contribution"
            value={loading ? "…" : model?.contribution?.value}
            meta={model?.contribution?.meta || "Set a target when you know how you want to invest."}
            empty={!loading && !model?.contribution}
          />
        </div>
      </div>

      <div className="mt-1.5 flex flex-wrap items-stretch gap-5">
        <section className="flex min-w-0 flex-[1_1_580px] flex-col rounded-2xl bg-card px-[30px] pt-7 pb-[26px]">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-cta" />
            <span className="text-[10.5px] font-semibold tracking-[0.16em] text-link uppercase">Start here</span>
          </div>
          {loading ? null : firstLesson ? (
            <>
              <h2 className="mt-[18px] text-[27px] font-medium tracking-[-0.015em] text-[#ECECE8]">
                {firstLesson.title}
              </h2>
              <p className="mt-[11px] max-w-[58ch] text-[15px] leading-relaxed text-muted">{firstLesson.body}</p>
              <div className="mt-6 flex flex-col gap-px overflow-hidden rounded-xl bg-[#1A1D22]">
                {model?.lessons.map((lesson, index) => (
                  <LessonRow
                    key={lesson.topic}
                    index={String(index + 1).padStart(2, "0")}
                    title={lesson.title}
                    current={index === 0}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyBlock
              title="Nothing to learn yet"
              body="Your first lessons will appear here from your plan."
            />
          )}

          <div className="mt-[26px] flex flex-wrap items-center gap-3.5">
            <Link
              href="/learn"
              className="flex h-[42px] items-center gap-[9px] rounded-[10px] bg-cta px-5 text-sm font-semibold text-white hover:bg-cta-hover"
            >
              Start the first lesson
              <ArrowIcon />
            </Link>
            <Link href="/research" className="flex h-[42px] items-center gap-2 px-1.5 text-[13.5px] font-medium text-dim hover:text-link">
              Or look at a company first
            </Link>
          </div>
        </section>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl bg-card px-[26px] pt-[26px] pb-6">
          <div className="flex items-baseline gap-3">
            <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Thesis health</h3>
            <span className="text-[12.5px] text-dim">No theses yet</span>
          </div>
          <div className="mt-[22px] flex justify-center">
            <div className="relative h-[158px] w-[158px]">
              <svg width="158" height="158" viewBox="0 0 158 158">
                <circle cx="79" cy="79" r="70" fill="none" stroke="#1A1D22" strokeWidth="7" strokeDasharray="2 8" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[40px] font-light tracking-[-0.03em] text-[#3A4048] leading-none">—</span>
                <span className="mt-[7px] text-[12.5px] font-medium leading-none text-dim">Nothing to monitor</span>
              </div>
            </div>
          </div>
          <p className="mt-[22px] text-[13px] leading-relaxed text-muted">
            This score follows how well you keep your reasoning up to date. It appears once you&apos;ve written your first thesis.
          </p>
          <div className="mt-5 border-t border-[#1A1D22] pt-[18px]">
            <div className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">A thesis is</div>
            <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
              Why you would invest, what needs to stay true, and what would make you change your mind.
            </p>
          </div>
          <div className="mt-auto pt-[18px]">
            <TextLink href="/theses">See what goes into one</TextLink>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="flex min-w-0 flex-[1_1_580px] flex-col rounded-2xl bg-card px-[30px] pt-6 pb-[22px]">
          <div className="flex flex-wrap items-center gap-3.5">
            <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Your holdings</h3>
            <span className="text-[12.5px] text-dim">Nothing tracked yet</span>
          </div>
          <div className="mt-[18px] flex flex-col items-center gap-3.5 border-y border-[#191C20] py-[34px] text-center">
            <svg width="72" height="26" viewBox="0 0 72 26" fill="none" aria-hidden="true">
              <path d="M0 22h72" stroke="#22262C" strokeWidth="1.6" strokeDasharray="3 6" strokeLinecap="round" />
            </svg>
            <p className="max-w-[40ch] text-[13.5px] leading-relaxed text-muted">
              When you own something — here or elsewhere — add it so Quantora can watch the reasoning behind it.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link
                href="/portfolio"
                className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#232830] bg-[#14171B] px-4 text-[13px] font-medium text-[#DDDDD8] hover:bg-[#191C21] hover:text-white"
              >
                Add an investment I already own
              </Link>
              <Link href="/research" className="flex h-[38px] items-center gap-2 px-4 text-[13px] font-medium text-link hover:text-link-hover">
                Research something new
              </Link>
            </div>
          </div>
          <div className="mt-[18px] text-xs text-dim">
            Adding what you own doesn&apos;t connect a broker. It&apos;s for tracking your own reasoning.
          </div>
        </section>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl bg-card px-[26px] pt-6 pb-[22px]">
          <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Upcoming</h3>
          <EmptyBlock
            title="Nothing scheduled"
            body="Contribution dates, thesis reviews and earnings will appear here once you have something to track."
          />
          <div className="mt-auto pt-[18px]">
            <TextLink href="/plan">View calendar</TextLink>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="flex min-w-0 flex-[1_1_580px] flex-col rounded-2xl border border-[#171A1E] bg-card-alt px-[30px] pt-6 pb-[22px]">
          <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Your learning path</h3>
          {loading ? null : firstLesson ? (
            <>
              <div className="mt-[18px] flex flex-wrap items-center gap-3.5">
                <span className="min-w-0 flex-[1_1_200px] text-sm font-medium text-[#DDDDD8]">From your plan</span>
                <span className="text-[12.5px] text-dim">Not started</span>
              </div>
              <div className="mt-3 h-[3px] rounded-sm bg-[#1E2228]" />
              <div className="mt-6 border-t border-[#191C20] pt-5">
                <div className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">First lesson</div>
                <div className="mt-3 text-[17px] font-medium tracking-[-0.01em] text-[#ECECE8]">{firstLesson.title}</div>
                <p className="mt-[9px] max-w-[52ch] text-sm leading-relaxed text-muted">{firstLesson.body}</p>
              </div>
            </>
          ) : (
            <EmptyBlock title="No path yet" body="Lessons will be chosen from what you still want to understand." />
          )}
          <div className="mt-auto pt-5">
            <TextLink href="/learn">Start learning</TextLink>
          </div>
        </section>

        <section className="flex min-w-0 flex-[1_1_320px] flex-col rounded-2xl border border-[#171A1E] bg-card-alt px-[26px] pt-6 pb-[22px]">
          <h3 className="text-[15.5px] font-semibold text-[#ECECE8]">Research</h3>
          <div className="mt-[18px] text-sm text-muted">Nothing started yet.</div>
          <div className="mt-3.5 flex gap-[5px]">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-[3px] flex-1 rounded-sm bg-[#1E2228]" />
            ))}
          </div>
          <div className="mt-[22px] border-t border-[#191C20] pt-[18px]">
            <div className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">Five steps</div>
            <div className="mt-3 text-[13.5px] leading-[1.7] text-muted">
              Understand the business · Review financials · Define your assumptions · Identify risks · Decide
            </div>
          </div>
          <div className="mt-auto pt-5">
            <TextLink href="/research">Start your first research</TextLink>
          </div>
        </section>
      </div>

      <div className="pt-2 text-[12.5px] text-dim">Quantora helps you think. It never tells you what to buy.</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  meta,
  empty,
  dot,
}: {
  label: string;
  value?: string;
  meta: string;
  empty?: boolean;
  dot?: boolean;
}) {
  return (
    <div className="min-w-0 flex-[1_1_240px] rounded-[14px] border border-[#171A1E] bg-card-alt px-5 py-[18px]">
      <div className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">{label}</div>
      <div className="mt-[13px] flex items-baseline gap-[9px]">
        {dot ? <span className="mt-1 h-[7px] w-[7px] shrink-0 rounded-full bg-[#56A177]" /> : null}
        <span className={`text-[19px] font-normal tracking-[-0.01em] ${empty ? "text-dim" : "text-[#ECECE8]"}`}>
          {value || "Not set yet"}
        </span>
      </div>
      <div className="mt-3 text-[12.5px] text-dim">{meta}</div>
    </div>
  );
}

function LessonRow({ index, title, current }: { index: string; title: string; current?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 bg-[#141619] px-[17px] py-[15px]">
      <span className={`w-[18px] shrink-0 text-[11px] font-semibold tracking-[0.1em] ${current ? "text-link" : "text-dim"}`}>
        {index}
      </span>
      <span className={`min-w-0 flex-[1_1_220px] text-sm ${current ? "text-[#DDDDD8]" : "text-muted"}`}>{title}</span>
    </div>
  );
}

function EmptyBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-[18px] rounded-xl border border-dashed border-[#232830] px-4 py-5">
      <div className="text-[15px] font-medium text-[#ECECE8]">{title}</div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-[13px] font-medium text-link hover:text-link-hover">
      {children}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" />
      </svg>
    </Link>
  );
}
