import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useRouter, usePathname } from "expo-router";
import type { User } from "@/types/auth";
import { authApi } from "@/lib/auth/api";
import { shouldRedirectToLogin } from "@/lib/auth/public-routes";
import {
  clearLegacyAuthStorage,
  connectSocketFromSession,
} from "@/lib/auth/session";
import { disconnectSocket } from "@/lib/socket/client";
import { getAccessTokenSync } from "@/platform/secure-storage";
import { AUTH_REDIRECT_LOGIN, appEvents } from "@/platform/events";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (user?: User) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  applyUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const clearAuthLocalOnly = useCallback(() => {
    clearLegacyAuthStorage();
    setUser(null);
    disconnectSocket();
    if (shouldRedirectToLogin(pathname || "/")) {
      router.push("/auth/login");
    }
  }, [router, pathname]);

  const login = useCallback(async (userData?: User) => {
    clearLegacyAuthStorage();
    if (userData) {
      setUser(userData);
    }
    const { user: currentUser } = await authApi.getCurrentUser();
    setUser(currentUser);
    try {
      await connectSocketFromSession();
    } catch (err) {
      console.warn("[auth] socket connect after login failed", err);
    }
  }, []);

  const logout = useCallback(() => {
    void authApi.logout().finally(() => {
      clearLegacyAuthStorage();
      disconnectSocket();
      setUser(null);
      router.push("/auth/login");
    });
  }, [router]);

  const refreshUser = useCallback(async () => {
    const { user: userData } = await authApi.getCurrentUser();
    setUser(userData);
    await connectSocketFromSession();
  }, []);

  const applyUser = useCallback((userData: User) => {
    setUser(userData);
  }, []);

  useEffect(() => {
    clearLegacyAuthStorage();

    const checkAuth = async () => {
      try {
        if (!getAccessTokenSync()) {
          setUser(null);
          return;
        }
        await refreshUser();
      } catch {
        disconnectSocket();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, [refreshUser]);

  useEffect(() => {
    return appEvents.on(AUTH_REDIRECT_LOGIN, () => {
      clearAuthLocalOnly();
    });
  }, [clearAuthLocalOnly]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        applyUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
