"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, Calendar, LogOut, TrendingUp, User, X, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import { NAV_ITEMS } from "shared";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Activity,
  BarChart3,
  Calendar,
  TrendingUp,
  User,
};

interface SidebarProps {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar({
  userName,
  userEmail,
  userAvatarUrl,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    onMobileClose();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full w-[220px] flex-col border-r border-[var(--card-border)] [background:var(--sidebar-bg)] py-6">
      {/* Logo */}
      <div className="mb-6 flex items-center gap-2 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-600">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <span className="text-[14px] font-bold text-[var(--text-primary)]">Cycling Companion</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName];
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-[var(--active-nav-bg)] font-semibold text-[var(--accent)]"
                  : "font-normal text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] ${active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
              />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-normal text-[var(--text-secondary)] transition-colors hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="h-[18px] w-[18px] text-[var(--text-muted)]" />
          Cerrar sesión
        </button>
      </nav>

      {/* Bottom section */}
      <div className="mt-auto flex flex-col gap-2 px-3">
        <ThemeToggle showLabel />

        {/* User info */}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          {userAvatarUrl ? (
            <Image
              src={userAvatarUrl}
              alt={userName}
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-[11px] font-bold text-white">
              {getInitials(userName)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
              {userName}
            </p>
            <p className="truncate text-[11px] text-[var(--text-muted)]">{userEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block">{sidebarContent}</aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onMobileClose} />
          {/* Sidebar */}
          <div className="relative z-10 flex h-full w-fit">
            {sidebarContent}
            <button
              onClick={onMobileClose}
              className="absolute right-2 top-4 rounded-lg p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
