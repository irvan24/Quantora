import { api } from "@/lib/auth";

export type Thesis = {
  id: number;
  title: string;
  symbol: string | null;
  thesisBody: string;
  invalidation: string | null;
  points: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type ThesisInput = {
  title: string;
  symbol?: string;
  thesisBody: string;
  invalidation?: string;
  points?: string;
};

export async function listTheses() {
  return api<Thesis[]>("/api/theses");
}

export async function getThesisSummary() {
  return api<{ count: number }>("/api/theses/summary");
}

export async function createThesis(input: ThesisInput) {
  return api<Thesis>("/api/theses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateThesis(id: number, input: ThesisInput) {
  return api<Thesis>(`/api/theses/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteThesis(id: number) {
  return api<void>(`/api/theses/${id}`, { method: "DELETE" });
}

export type ReviewVerdict = "STILL_VALID" | "WATCHING" | "INVALIDATED";

export type ThesisReview = {
  id: number;
  verdict: ReviewVerdict;
  note: string | null;
  createdAt: string;
};

export type ThesisReviewInput = {
  verdict: ReviewVerdict;
  note?: string;
};

export async function listThesisReviews(thesisId: number) {
  return api<ThesisReview[]>(`/api/theses/${thesisId}/reviews`);
}

export async function createThesisReview(thesisId: number, input: ThesisReviewInput) {
  return api<ThesisReview>(`/api/theses/${thesisId}/reviews`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
