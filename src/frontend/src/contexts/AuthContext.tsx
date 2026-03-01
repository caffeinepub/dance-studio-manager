import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppUser } from "../backend.d.ts";

const AUTH_STORAGE_KEY = "dsm_auth_user";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 5 * 60 * 1000; // warn at 25 minutes (5 min before logout)

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

  const [showWarning, setShowWarning] = useState(false);

  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current !== null) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current !== null) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const logout = useCallback(() => {
    clearTimers();
    setShowWarning(false);
    setCurrentUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [clearTimers]);

  const startTimers = useCallback(() => {
    clearTimers();

    // Show warning at 25 minutes
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS);

    // Auto logout at 30 minutes
    logoutTimerRef.current = setTimeout(() => {
      setShowWarning(false);
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  }, [clearTimers, logout]);

  const resetActivity = useCallback(() => {
    // Only reset if user is logged in — check via ref to avoid stale closure
    startTimers();
    setShowWarning(false);
  }, [startTimers]);

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

  // Start/stop inactivity tracking based on login state
  useEffect(() => {
    if (!currentUser) {
      clearTimers();
      setShowWarning(false);
      return;
    }

    // Start timers on login
    startTimers();

    const events = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
    ] as const;

    const handleActivity = () => {
      startTimers();
      setShowWarning(false);
    };

    for (const event of events) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      for (const event of events) {
        window.removeEventListener(event, handleActivity);
      }
      clearTimers();
    };
  }, [currentUser, startTimers, clearTimers]);

  const handleStayLoggedIn = useCallback(() => {
    setShowWarning(false);
    resetActivity();
  }, [resetActivity]);

  const isAdmin = currentUser?.role === "admin";
  const isStaff = currentUser?.role === "staff" || currentUser?.role === "user";
  const isGuest = currentUser?.role === "guest";

  return (
    <AuthContext.Provider
      value={{ currentUser, login, logout, isAdmin, isStaff, isGuest }}
    >
      {children}

      {/* Auto-logout warning dialog */}
      <AlertDialog open={showWarning}>
        <AlertDialogContent
          className="border-border bg-card"
          style={{
            borderColor: "oklch(var(--primary) / 0.4)",
            boxShadow: "0 0 40px oklch(var(--primary) / 0.2)",
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground flex items-center gap-2 text-lg font-semibold">
              <span className="text-primary">⚠</span>
              Session Expiring Soon
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              You will be automatically logged out in{" "}
              <span className="text-primary font-semibold">5 minutes</span> due
              to inactivity. Click{" "}
              <span className="text-foreground font-medium">
                "Stay Logged In"
              </span>{" "}
              to continue your session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <Button
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              Log Out Now
            </Button>
            <AlertDialogAction asChild>
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleStayLoggedIn}
              >
                Stay Logged In
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
