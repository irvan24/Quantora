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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSession();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as T;
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
  if (!isAuthSession(payload)) {
    throw new Error("Something went wrong. Try again.");
  }
  writeSession({
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    user: payload.user,
  });
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

  if (isAuthSession(payload)) {
    writeSession({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
      user: payload.user,
    });
    return payload.user;
  }

  return login(input.email, input.password);
}

export async function logout() {
  const session = readSession();
  try {
    if (session?.refreshToken) {
      await api("/api/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: session.refreshToken }),
      });
    }
  } finally {
    clearSession();
  }
}
