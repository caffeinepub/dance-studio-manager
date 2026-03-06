import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  CheckCircle,
  KeyRound,
  Loader2,
  Plus,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppUser } from "../backend.d.ts";
import {
  useAllAppUsers,
  useCreateAppUser,
  useDeactivateAppUser,
  useResetUserPassword,
} from "../hooks/useQueries";

// ─── Role helpers ──────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; className: string }> = {
    admin: {
      label: "Admin",
      className: "bg-primary/15 text-primary border-primary/30",
    },
    staff: {
      label: "Staff",
      className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    user: {
      label: "Staff",
      className: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    },
    guest: {
      label: "Guest",
      className: "bg-muted/50 text-muted-foreground border-border",
    },
  };
  const c = config[role] ?? {
    label: role,
    className: "border-border text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={`text-xs ${c.className}`}>
      {c.label}
    </Badge>
  );
}

// ─── Reset Password Dialog ────────────────────────────────────────────────────

function ResetPasswordDialog({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const resetPassword = useResetUserPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }
    if (newPassword.trim().length < 4) {
      setError("Password must be at least 4 characters");
      return;
    }
    try {
      await resetPassword.mutateAsync({
        userId: user.id,
        newPassword: newPassword.trim(),
      });
      toast.success(`Password reset for ${user.username}`);
      onClose();
    } catch (err) {
      setError(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            Reset Password
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">
          Setting new password for{" "}
          <strong className="text-foreground">{user.username}</strong>
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">New Password *</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError("");
              }}
              placeholder="Enter new password"
              className="bg-input border-border"
              autoFocus
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={resetPassword.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {resetPassword.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Set Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const { data: users = [], isLoading } = useAllAppUsers();
  const deactivate = useDeactivateAppUser();
  const [resetUser, setResetUser] = useState<AppUser | null>(null);
  const [deactivateUser, setDeactivateUser] = useState<AppUser | null>(null);

  const handleDeactivate = async () => {
    if (!deactivateUser) return;
    try {
      await deactivate.mutateAsync(deactivateUser.id);
      toast.success(`${deactivateUser.username} has been deactivated`);
      setDeactivateUser(null);
    } catch (err) {
      toast.error(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No users found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="divide-y divide-border">
          {users.map((user) => (
            <div
              key={user.id.toString()}
              className="flex flex-wrap items-center gap-3 px-4 py-3.5 hover:bg-secondary/20 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="font-display font-bold text-primary text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-foreground text-sm">
                    {user.username}
                  </p>
                  <RoleBadge role={user.role} />
                  {!user.isActive && (
                    <Badge
                      variant="outline"
                      className="text-xs text-muted-foreground border-border"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user.mobileNumber}
                </p>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {user.isActive ? (
                  <ShieldCheck className="w-4 h-4 text-success" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              {/* Actions */}
              {user.isActive && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setResetUser(user)}
                    className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground border border-border hover:border-primary/30"
                  >
                    <KeyRound className="w-3 h-3" />
                    Reset Password
                  </Button>
                  {user.role !== "admin" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeactivateUser(user)}
                      className="h-8 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-destructive border border-border hover:border-destructive/30"
                    >
                      <UserX className="w-3 h-3" />
                      Deactivate
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reset Password Dialog */}
      {resetUser && (
        <ResetPasswordDialog
          user={resetUser}
          onClose={() => setResetUser(null)}
        />
      )}

      {/* Deactivate Confirmation */}
      <AlertDialog
        open={!!deactivateUser}
        onOpenChange={(o) => !o && setDeactivateUser(null)}
      >
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Deactivate User?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will deactivate{" "}
              <strong className="text-foreground">
                {deactivateUser?.username}
              </strong>
              . They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ─── Create User Tab ───────────────────────────────────────────────────────────

function CreateUserTab({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    username: "",
    mobileNumber: "",
    password: "",
    role: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const createUser = useCreateAppUser();

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.username.trim()) return setError("Username is required");
    if (!form.mobileNumber.trim()) return setError("Mobile number is required");
    if (!form.password.trim()) return setError("Password is required");
    if (form.password.trim().length < 4)
      return setError("Password must be at least 4 characters");
    if (!form.role) return setError("Please select a role");

    try {
      await createUser.mutateAsync({
        username: form.username.trim(),
        mobileNumber: form.mobileNumber.trim(),
        password: form.password.trim(),
        role: form.role,
      });
      toast.success(`User "${form.username}" created successfully`);
      setSuccess(true);
      setForm({ username: "", mobileNumber: "", password: "", role: "" });
      setTimeout(() => {
        setSuccess(false);
        onCreated();
      }, 1500);
    } catch (err) {
      setError(
        `Failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="font-display font-semibold text-foreground text-base mb-4">
        Create New User
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-foreground text-sm">Username *</Label>
            <Input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              placeholder="Full name"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Mobile Number *</Label>
            <Input
              type="tel"
              value={form.mobileNumber}
              onChange={(e) => set("mobileNumber", e.target.value)}
              placeholder="10-digit number"
              className="bg-input border-border"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-foreground text-sm">Password *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="Min 4 characters"
              className="bg-input border-border"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-foreground text-sm">Role *</Label>
            <Select value={form.role} onValueChange={(v) => set("role", v)}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="admin">Admin (Full access)</SelectItem>
                <SelectItem value="staff">
                  Staff (Admissions + Fees + Dashboard)
                </SelectItem>
                <SelectItem value="guest">Guest (Dashboard only)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Staff can admit students, assign batches, and collect fees. Guests
              can only view the dashboard.
            </p>
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
          disabled={createUser.isPending || success}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 gap-2"
        >
          {createUser.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {createUser.isPending
            ? "Creating..."
            : success
              ? "Created!"
              : "Create User"}
        </Button>
      </form>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          User Management
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage staff accounts, roles, and access permissions
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <TabsList className="bg-secondary border border-border p-1 h-auto gap-1">
          <TabsTrigger
            value="users"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm rounded-md transition-all"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm px-4 py-2 text-sm rounded-md transition-all"
          >
            Create User
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="create">
          <CreateUserTab onCreated={() => setActiveTab("users")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
