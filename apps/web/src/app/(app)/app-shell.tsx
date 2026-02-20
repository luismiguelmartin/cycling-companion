"use client";

import { useState } from "react";
import { Menu, Zap } from "lucide-react";
import { Sidebar } from "@/components/sidebar";

interface AppShellProps {
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  children: React.ReactNode;
}

export function AppShell({ userName, userEmail, userAvatarUrl, children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[var(--page-bg)]">
      <Sidebar
        userName={userName}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-[var(--card-border)] bg-[var(--surface-bg)] px-4 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-bold text-[var(--text-primary)]">
              Cycling Companion
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="rounded-lg p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
