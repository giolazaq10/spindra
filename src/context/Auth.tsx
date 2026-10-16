import { useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { AuthContext as Context } from "./authState";
import { authConfigured, supabase } from "@/lib/supabase";
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(authConfigured);
  useEffect(() => {
    if (!authConfigured) return;
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) {
          setUser(data.session?.user ?? null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (alive) setLoading(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);
  return (
    <Context.Provider value={{ user, loading }}>{children}</Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
