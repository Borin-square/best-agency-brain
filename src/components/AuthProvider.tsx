"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { supabase, supabaseReady } from "@/lib/supabase";
import type { Session, UserProfile } from "@/lib/auth";

interface AuthCtx {
  session: Session | null;
  loading: boolean;
  loginWithMagicLink: (email: string) => Promise<string | null>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  session: null,
  loading: true,
  loginWithMagicLink: async () => null,
  logout: () => {},
  refresh: async () => {},
});

function toSession(p: UserProfile): Session {
  return {
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    role: p.role,
  };
}

async function loadProfile(userId: string): Promise<Session | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return toSession(data as UserProfile);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 5000);

    if (!supabaseReady) {
      setLoading(false);
      clearTimeout(timeout);
      return;
    }

    supabase.auth
      .getSession()
      .then(async ({ data: { session: authSession } }) => {
        if (authSession?.user) {
          const profile = await loadProfile(authSession.user.id);
          if (profile) setSession(profile);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        clearTimeout(timeout);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession) {
        setSession(null);
      } else if (!sessionRef.current) {
        loadProfile(authSession.user.id).then((profile) => {
          if (profile) setSession(profile);
          setLoading(false);
        });
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const loginWithMagicLink = useCallback(
    async (email: string): Promise<string | null> => {
      if (!supabaseReady) return "Supabase non configurato";
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/api/auth/callback`
                : undefined,
          },
        });
        if (error) return error.message;
        return null;
      } catch (e) {
        return (e as Error).message || "Errore di connessione";
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setSession(null);
    try {
      await supabase.auth.signOut();
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();
      if (authSession?.user) {
        const profile = await loadProfile(authSession.user.id);
        if (profile) setSession(profile);
      }
    } catch {}
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, loading, loginWithMagicLink, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
