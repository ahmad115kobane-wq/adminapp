"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext, User, getStoredAuth, storeAuth, clearAuth } from "@/lib/auth";
import { Toaster } from "sonner";

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = getStoredAuth();
    if (stored.user && stored.token) {
      if (stored.user.role !== "admin") {
        clearAuth();
        router.push("/login");
      } else {
        setUser(stored.user);
        setToken(stored.token);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.push("/login");
    }
  }, [loading, user, pathname, router]);

  const login = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    storeAuth(u, t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearAuth();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user }}>
      <Toaster position="top-right" richColors />
      {children}
    </AuthContext.Provider>
  );
}
