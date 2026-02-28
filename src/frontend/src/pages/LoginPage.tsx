import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2, Lock, Phone, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { useGuestLogin, useLoginUser } from "../hooks/useQueries";

export default function LoginPage() {
  const { login } = useAuth();
  const loginUser = useLoginUser();
  const guestLoginMutation = useGuestLogin();

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const [guestOpen, setGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestMobile, setGuestMobile] = useState("");
  const [guestError, setGuestError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!mobile.trim()) {
      setError("Please enter your mobile number");
      return;
    }
    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }
    try {
      const user = await loginUser.mutateAsync({
        mobileNumber: mobile.trim(),
        password: password.trim(),
      });
      if (!user) {
        setError("Invalid mobile number or password");
        return;
      }
      if (!user.isActive) {
        setError(
          "Your account has been deactivated. Please contact the admin.",
        );
        return;
      }
      login(user);
      toast.success(`Welcome back, ${user.username}!`);
    } catch (err) {
      setError(
        `Login failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError("");
    if (!guestName.trim()) {
      setGuestError("Please enter your name");
      return;
    }
    if (!guestMobile.trim()) {
      setGuestError("Please enter your mobile number");
      return;
    }
    try {
      const user = await guestLoginMutation.mutateAsync({
        name: guestName.trim(),
        mobileNumber: guestMobile.trim(),
      });
      login(user);
      toast.success(`Welcome, ${user.username}!`);
      setGuestOpen(false);
    } catch (err) {
      setGuestError(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/15 rounded-full blur-[80px] -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-primary/8 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-primary/8 rounded-full blur-3xl -translate-x-1/2" />
        <div className="sidebar-pattern absolute inset-0 opacity-10" />
      </div>

      <div className="relative w-full max-w-md space-y-6">
        {/* Header / Branding */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/40 rounded-full blur-2xl scale-[2]" />
              <div className="relative w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center shadow-glow-red">
                <img
                  src="/assets/generated/dance-studio-logo-transparent.dim_200x200.png"
                  alt="Dance Studio Logo"
                  className="w-16 h-16 object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
          <div>
            <h1 className="font-display text-4xl font-bold text-primary tracking-tight drop-shadow-[0_0_20px_oklch(0.58_0.26_27/0.6)]">
              No. 1 Dance Studio
            </h1>
            <p className="text-primary/80 font-semibold text-xs tracking-[0.3em] uppercase mt-1 border border-primary/30 rounded-full px-4 py-1 inline-block bg-primary/10">
              Management System
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-primary/20 rounded-xl shadow-glow p-6 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <div>
            <h2 className="font-display font-bold text-foreground text-lg">
              Sign In
            </h2>
            <p className="text-muted-foreground text-sm mt-0.5">
              Enter your credentials to access the system
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Mobile Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter mobile number"
                  className="pl-9 bg-input border-border"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter password"
                  className="pl-9 bg-input border-border"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loginUser.isPending}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 font-semibold gap-2"
            >
              {loginUser.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {loginUser.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Guest Login */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setGuestOpen(true)}
            className="w-full border-border text-muted-foreground hover:text-foreground hover:border-primary/40 gap-2 h-10"
          >
            <Users className="w-4 h-4" />
            Continue as Guest (View Only)
          </Button>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground/40 text-xs">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>

      {/* Guest Login Dialog */}
      <Dialog
        open={guestOpen}
        onOpenChange={(o) => {
          if (!o) {
            setGuestOpen(false);
            setGuestError("");
          }
        }}
      >
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Guest Access
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground -mt-1">
            Enter your details to view the dashboard as a guest. No password
            required.
          </p>

          <form onSubmit={handleGuestLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Your Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    setGuestError("");
                  }}
                  placeholder="Enter your full name"
                  className="pl-9 bg-input border-border"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-foreground text-sm">Mobile Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  value={guestMobile}
                  onChange={(e) => {
                    setGuestMobile(e.target.value);
                    setGuestError("");
                  }}
                  placeholder="Enter mobile number"
                  className="pl-9 bg-input border-border"
                />
              </div>
            </div>

            {guestError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {guestError}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setGuestOpen(false);
                  setGuestError("");
                }}
                className="flex-1 border-border"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={guestLoginMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {guestLoginMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Continue
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
