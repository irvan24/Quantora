"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { type Lesson, markLessonCompleted, isLessonCompleted } from "@/lib/learn";
import { useState } from "react";

export function LessonView({ lesson }: { lesson: Lesson }) {
  const router = useRouter();
  const [completed, setCompleted] = useState(() => isLessonCompleted(lesson.topic));

  function onComplete() {
    markLessonCompleted(lesson.topic);
    setCompleted(true);
    router.push("/learn");
  }

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-10 px-4 py-10 sm:px-8 sm:py-14">
      <Link
        href="/learn"
        className="inline-flex items-center gap-2 text-[13px] font-medium text-dim hover:text-link"
      >
        <ArrowLeft size={14} strokeWidth={1.8} aria-hidden="true" />
        All lessons
      </Link>

      <header>
        <div className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">
          {lesson.durationMinutes} min read
        </div>
        <h1 className="mt-3 text-[34px] font-light tracking-[-0.02em] text-[#ECECE8] leading-tight">
          {lesson.title}
        </h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">{lesson.subtitle}</p>
      </header>

      <div className="flex flex-col gap-9">
        {lesson.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-[18px] font-medium tracking-[-0.01em] text-[#ECECE8]">{section.heading}</h2>
            <div className="mt-3 flex flex-col gap-3">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[15px] leading-[1.65] text-muted">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="rounded-2xl border border-[#232830] bg-card px-6 py-5">
        <div className="text-[10.5px] font-semibold tracking-[0.16em] text-link uppercase">Takeaway</div>
        <p className="mt-2.5 text-[15px] leading-relaxed text-[#DDDDD8]">{lesson.takeaway}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {completed ? (
          <span className="flex h-[42px] items-center gap-2 rounded-[10px] border border-[#2A3D32] bg-[#141A17] px-5 text-sm font-medium text-[#8BC4A8]">
            <Check size={16} strokeWidth={2} aria-hidden="true" />
            Completed
          </span>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            className="flex h-[42px] items-center rounded-[10px] bg-cta px-5 text-sm font-semibold text-white hover:bg-cta-hover"
          >
            Mark as complete
          </button>
        )}
        <Link href="/home" className="text-[13.5px] font-medium text-link hover:text-link-hover">
          Back to Home
        </Link>
        {lesson.topic === "INVESTMENT_THESIS" ? (
          <Link href="/theses" className="text-[13.5px] font-medium text-dim hover:text-link">
            Write a thesis
          </Link>
        ) : null}
      </div>
    </div>
  );
}
