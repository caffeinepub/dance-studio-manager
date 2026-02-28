import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { AppUser } from "../backend.d.ts";

const AUTH_STORAGE_KEY = "dsm_auth_user";

interface AuthUser {
  id: bigint;
  username: string;
  role: string;
  mobileNumber: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
  isGuest: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function serializeUser(user: AuthUser): string {
  return JSON.stringify({
    id: user.id.toString(),
    username: user.username,
    role: user.role,
    mobileNumber: user.mobileNumber,
  });
}

function deserializeUser(raw: string): AuthUser | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.id || !parsed?.username || !parsed?.role) return null;
    return {
      id: BigInt(parsed.id),
      username: parsed.username,
      role: parsed.role,
      mobileNumber: parsed.mobileNumber ?? "",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) return deserializeUser(raw);
    } catch {
      /* ignore */
    }
    return null;
  });

  const login = useCallback((user: AppUser) => {
    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      role: user.role,
      mobileNumber: user.mobileNumber,
    };
    setCurrentUser(authUser);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, serializeUser(authUser));
    } catch {
      /* ignore */
    }
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const isAdmin = currentUser?.role === "admin";
  const isStaff = currentUser?.role === "staff" || currentUser?.role === "user";
  const isGuest = currentUser?.role === "guest";

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, isAdmin, isStaff, isGuest }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
