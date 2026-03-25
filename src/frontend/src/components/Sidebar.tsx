import { cn } from "@/lib/utils";
import {
  BarChart2,
  CalendarRange,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Music,
  Shield,
  Star,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";
import { useAuth } from "../contexts/AuthContext";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

interface NavItem {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "staff", "user", "guest"],
  },
  {
    id: "students",
    label: "Students",
    icon: Users,
    roles: ["admin", "staff", "user"],
  },
  {
    id: "batches",
    label: "Batches",
    icon: Music,
    roles: ["admin", "staff", "user"],
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: CheckSquare,
    roles: ["admin", "staff"],
  },
  {
    id: "solo",
    label: "Solo Programmes",
    icon: Star,
    roles: ["admin", "staff", "user"],
  },
  {
    id: "fees",
    label: "Fee Collection",
    icon: Wallet,
    roles: ["admin", "staff", "user"],
  },
  {
    id: "feetracker",
    label: "Fee Tracker",
    icon: ClipboardList,
    roles: ["admin"],
  },
  {
    id: "reports",
    label: "Reports",
    icon: BarChart2,
    roles: ["admin"],
  },
  {
    id: "yearchangeover",
    label: "Year Changeover",
    icon: CalendarRange,
    roles: ["admin"],
  },
  {
    id: "users",
    label: "User Management",
    icon: UserCog,
    roles: ["admin"],
  },
];

function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "Admin",
    staff: "Staff",
    user: "Staff",
    guest: "Guest",
  };
  return labels[role] ?? role;
}

function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    admin: "bg-primary/20 text-primary border-primary/30",
    staff: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    user: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    guest: "bg-muted/50 text-muted-foreground border-border",
  };
  return colors[role] ?? "bg-muted/50 text-muted-foreground border-border";
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const visibleItems = navItems.filter((item) =>
    currentUser ? item.roles.includes(currentUser.role) : false,
  );

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-sidebar-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow flex-shrink-0 overflow-hidden">
            <img
              src="/assets/generated/dance-studio-logo.dim_200x200.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h1 className="font-display font-bold text-primary text-base leading-tight">
              No. 1 Dance Studio
            </h1>
            <p className="text-primary/60 text-xs font-medium tracking-wide">
              Management System
            </p>
          </div>
        </div>
      </div>

      <div className="h-1 w-full sidebar-pattern opacity-40" />

      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id;
          return (
            <button
              type="button"
              key={id}
              onClick={() => {
                onNavigate(id);
                setMobileOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-left",
                isActive
                  ? "bg-primary/20 text-primary shadow-glow border border-primary/40"
                  : "text-sidebar-foreground/70 hover:text-primary/80 hover:bg-primary/10 hover:border hover:border-primary/20",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-sidebar-foreground/50",
                )}
              />
              <span>{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {currentUser && (
        <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-sidebar-accent/40">
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sidebar-foreground text-xs font-semibold truncate">
                {currentUser.username}
              </p>
              <span
                className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium ${getRoleColor(currentUser.role)}`}
              >
                {getRoleLabel(currentUser.role)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              setMobileOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-sidebar-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>

          <p className="text-sidebar-foreground/25 text-[10px] text-center pt-1">
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
      )}
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground border border-sidebar-border"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}

      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <NavContent />
      </aside>

      <aside
        className={cn(
          "lg:hidden flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}
