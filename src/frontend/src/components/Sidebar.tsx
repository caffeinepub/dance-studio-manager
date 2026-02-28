import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Menu,
  Music,
  Star,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Page } from "../App";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "students" as Page, label: "Students", icon: Users },
  { id: "batches" as Page, label: "Batches", icon: Music },
  { id: "solo" as Page, label: "Solo Programmes", icon: Star },
  { id: "fees" as Page, label: "Fee Collection", icon: Wallet },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-glow flex-shrink-0">
            <span className="text-primary-foreground font-display font-bold text-lg">
              D
            </span>
          </div>
          <div>
            <h1 className="font-display font-bold text-sidebar-foreground text-base leading-tight">
              Dance Studio
            </h1>
            <p className="text-sidebar-foreground/50 text-xs">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Diagonal pattern accent */}
      <div className="h-1 w-full sidebar-pattern opacity-40" />

      {/* Nav Items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
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
                  ? "bg-primary/15 text-primary shadow-glow border border-primary/20"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
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

      {/* Footer */}
      <div className="px-4 py-4 border-t border-sidebar-border">
        <p className="text-sidebar-foreground/30 text-xs text-center">
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
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-sidebar text-sidebar-foreground border border-sidebar-border"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          role="button"
          tabIndex={0}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setMobileOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile sidebar */}
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
