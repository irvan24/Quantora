"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { LessonView } from "@/components/learn/lesson-view";
import { getLesson } from "@/lib/learn";

export default function LessonPage() {
  const params = useParams();
  const topic = typeof params.topic === "string" ? params.topic : "";
  const lesson = getLesson(topic);

  if (!lesson) {
    return (
      <AppShell hideHeader>
        <div className="px-8 py-16">
          <h1 className="text-xl text-[#ECECE8]">Lesson not found</h1>
          <Link href="/learn" className="mt-4 inline-block text-sm text-link hover:text-link-hover">
            Back to Learn
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideHeader>
      <LessonView lesson={lesson} />
    </AppShell>
  );
}
