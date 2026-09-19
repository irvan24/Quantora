"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  type AuthUser,
  login as loginRequest,
  logout as logoutRequest,
  patchSessionUser,
  readSession,
  register as registerRequest,
} from "@/lib/auth";

type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: {
    firstName: string;
    email: string;
    password: string;
    termsAccepted: boolean;
  }) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readSession()?.user ?? null);
    setReady(true);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      ready,
      login: async (email, password) => {
        const nextUser = await loginRequest(email, password);
        setUser(nextUser);
        return nextUser;
      },
      register: async (input) => {
        const nextUser = await registerRequest(input);
        setUser(nextUser);
        return nextUser;
      },
      logout: async () => {
        await logoutRequest();
        setUser(null);
      },
      updateUser: (patch) => {
        const nextUser = patchSessionUser(patch);
        if (nextUser) {
          setUser(nextUser);
        }
      },
    }),
    [user, ready]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
