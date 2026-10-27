export type AuthUser = {
  id: number;
  firstName: string;
  lastName: string | null;
  email: string;
  role: string;
  onboardingCompleted?: boolean;
};

export type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  user?: AuthUser;
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const STORAGE_KEY = "quantora.session";

const AUTH_COOKIES = process.env.NEXT_PUBLIC_AUTH_COOKIES === "true";

export function readSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function patchSessionUser(patch: Partial<AuthUser>) {
  const session = readSession();
  if (!session) {
    return null;
  }
  const user = { ...session.user, ...patch };
  writeSession({ ...session, user });
  return user;
}

export function postAuthPath(user: AuthUser) {
  return user.onboardingCompleted ? "/home" : "/onboarding";
}

export function displayName(user: AuthUser) {
  return user.firstName?.trim() || "there";
}

export function initials(user: AuthUser) {
  const parts = [user.firstName, user.lastName].filter(Boolean) as string[];
  const letters = parts.map((part) => part[0]).join("").slice(0, 2);
  return letters.toUpperCase() || "Q";
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; errors?: Record<string, string> };
    if (body.errors) {
      return Object.values(body.errors)[0] ?? body.message ?? "Something went wrong. Try again.";
    }
    return body.message ?? "Something went wrong. Try again.";
  } catch {
    return "Something went wrong. Try again.";
  }
}

let refreshInFlight: Promise<boolean> | null = null;

function isPublicAuthPath(path: string) {
  return (
    path.startsWith("/api/auth/login") ||
    path.startsWith("/api/auth/register") ||
    path.startsWith("/api/auth/refresh") ||
    path.startsWith("/api/auth/logout") ||
    path.startsWith("/api/auth/forgot-password") ||
    path.startsWith("/api/auth/reset-password")
  );
}

async function request(path: string, init?: RequestInit, accessToken?: string) {
  return fetch(path, {
    ...init,
    credentials: AUTH_COOKIES ? "include" : "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(!AUTH_COOKIES && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
  });
}

async function refreshSession(): Promise<boolean> {
  const session = readSession();
  if (!session?.refreshToken) {
    return false;
  }
  const usedToken = session.refreshToken;
  try {
    const response = await request("/api/auth/refresh", {
      method: "POST",
      body: AUTH_COOKIES
        ? "{}"
        : JSON.stringify({ refreshToken: usedToken }),
    });
    if (!response.ok) {
      return rotatedByAnotherTab(usedToken);
    }
    const payload = (await response.json()) as AuthResponse;
    if (!payload.user) {
      return false;
    }
    if (AUTH_COOKIES) {
      writeSession({ accessToken: "", refreshToken: "", user: payload.user });
    } else if (!isAuthSession(payload)) {
      return false;
    } else {
      writeSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Refresh tokens are single use. When two tabs race, the loser gets a 401 but the
 * winner has already stored a fresh session: reuse it instead of logging everyone out.
 */
function rotatedByAnotherTab(usedToken: string) {
  const latest = readSession();
  return Boolean(latest?.refreshToken && latest.refreshToken !== usedToken);
}

function expireSession() {
  clearSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response = await request(path, init, readSession()?.accessToken);

  if (response.status === 401 && !isPublicAuthPath(path)) {
    if (!refreshInFlight) {
      refreshInFlight = refreshSession().finally(() => {
        refreshInFlight = null;
      });
    }
    const refreshed = await refreshInFlight;
    if (refreshed) {
      response = await request(path, init, readSession()?.accessToken);
    } else {
      expireSession();
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
}

export async function apiBlob(path: string): Promise<Blob | null> {
  let response = await request(path, { headers: { Accept: "image/*" } }, readSession()?.accessToken);
  if (response.status === 401 && !isPublicAuthPath(path)) {
    if (!refreshInFlight) {
      refreshInFlight = refreshSession().finally(() => {
        refreshInFlight = null;
      });
    }
    const refreshed = await refreshInFlight;
    if (refreshed) {
      response = await request(path, { headers: { Accept: "image/*" } }, readSession()?.accessToken);
    }
  }
  if (!response.ok) {
    return null;
  }
  return response.blob();
}

function isAuthSession(payload: AuthResponse): payload is AuthResponse & {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
} {
  return Boolean(payload.accessToken && payload.refreshToken && payload.user);
}

export async function login(email: string, password: string) {
  const payload = await api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!payload.user) {
    throw new Error("Something went wrong. Try again.");
  }
  if (AUTH_COOKIES) {
    writeSession({ accessToken: "", refreshToken: "", user: payload.user });
  } else if (!isAuthSession(payload)) {
    throw new Error("Something went wrong. Try again.");
  } else {
    writeSession({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user,
    });
  }
  return payload.user;
}

export async function register(input: {
  firstName: string;
  email: string;
  password: string;
  termsAccepted: boolean;
}) {
  const payload = await api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.firstName,
      email: input.email,
      password: input.password,
      termsAccepted: input.termsAccepted,
    }),
  });

  if (payload.user) {
    if (AUTH_COOKIES) {
      writeSession({ accessToken: "", refreshToken: "", user: payload.user });
    } else if (isAuthSession(payload)) {
      writeSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });
    }
    return payload.user;
  }

  return login(input.email, input.password);
}

export async function requestPasswordReset(email: string) {
  const response = await request("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  if (response.status === 204) {
    return { resetToken: null as string | null };
  }
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return (await response.json()) as { resetToken?: string };
}

export async function resetPassword(token: string, password: string) {
  await api("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
}

export async function fetchCurrentUser() {
  return api<AuthUser>("/api/auth/me");
}

export async function logout() {
  const session = readSession();
  try {
    const body = AUTH_COOKIES
      ? "{}"
      : JSON.stringify({ refreshToken: session?.refreshToken ?? "" });
    await api("/api/auth/logout", {
      method: "POST",
      body,
    });
  } finally {
    clearSession();
  }
}
