"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import { getOnboarding } from "@/lib/onboarding";
import { homeModel } from "@/lib/home";
import {
  asLessonTopic,
  FOUNDATION_TOPICS,
  lessonPath,
  listLessons,
  type Lesson,
  type LessonTopic,
  readCompletedLessons,
} from "@/lib/learn";

export function LearnCatalog() {
  const [recommended, setRecommended] = useState<LessonTopic[]>(FOUNDATION_TOPICS);
  const [completed, setCompleted] = useState<Set<LessonTopic>>(() => readCompletedLessons());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getOnboarding();
        if (!cancelled) {
          const lessons = homeModel(profile).lessons;
          const topics = lessons.map((l) => asLessonTopic(l.topic)).filter((t): t is LessonTopic => t != null);
          if (topics.length > 0) {
            setRecommended(topics);
          }
          setCompleted(readCompletedLessons());
        }
      } catch {
        // keep foundation default
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

  const recommendedLessons = listLessons(recommended);
  const foundationLessons = listLessons(FOUNDATION_TOPICS);

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-10 px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <h1 className="text-[34px] font-light tracking-[-0.02em] text-[#ECECE8]">Learn</h1>
        <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-muted">
          Short lessons tied to your plan. Complete them at your pace — progress is saved on this device.
        </p>
      </header>

      <section>
        <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">
          {loading ? "Recommended" : "From your plan"}
        </h2>
        <div className="mt-4 flex flex-col gap-2">
          {recommendedLessons.map((lesson) => (
            <LessonCard key={lesson.topic} lesson={lesson} done={completed.has(lesson.topic)} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-dim uppercase">Foundations</h2>
        <div className="mt-4 flex flex-col gap-2">
          {foundationLessons.map((lesson) => (
            <LessonCard key={lesson.topic} lesson={lesson} done={completed.has(lesson.topic)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function LessonCard({ lesson, done }: { lesson: Lesson; done: boolean }) {
  return (
    <Link
      href={lessonPath(lesson.topic)}
      className="flex items-center gap-4 rounded-xl border border-[#1E2228] bg-card px-4 py-4 hover:border-[#2A3040] hover:bg-[#14171B]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] font-medium text-[#ECECE8]">{lesson.title}</span>
          {done ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#8BC4A8]">
              <Check size={12} strokeWidth={2} aria-hidden="true" />
              Done
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-[13px] text-muted">{lesson.subtitle}</p>
        <p className="mt-1 text-[12px] text-dim">{lesson.durationMinutes} min</p>
      </div>
      <ChevronRight size={18} className="shrink-0 text-dim" strokeWidth={1.7} aria-hidden="true" />
    </Link>
  );
}
