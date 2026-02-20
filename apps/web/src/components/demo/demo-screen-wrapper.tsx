"use client";

import { Activity, BarChart3, Calendar, TrendingUp, User, Zap } from "lucide-react";

const NAV_ITEMS = [
  { icon: Activity, label: "Dashboard", id: "dashboard" },
  { icon: BarChart3, label: "Actividades", id: "activities" },
  { icon: Calendar, label: "Planificación", id: "plan" },
  { icon: TrendingUp, label: "Insights", id: "insights" },
  { icon: User, label: "Perfil", id: "profile" },
];

interface DemoScreenWrapperProps {
  activeScreenId: string;
  children: React.ReactNode;
}

export function DemoScreenWrapper({ activeScreenId, children }: DemoScreenWrapperProps) {
  return (
    <div className="flex h-full bg-[var(--page-bg)]">
      {/* Mini sidebar (desktop only) */}
      <aside className="hidden w-[220px] shrink-0 flex-col border-r border-[var(--card-border)] [background:var(--sidebar-bg)] py-6 md:flex">
        {/* Logo */}
        <div className="mb-6 flex items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-orange-500 to-orange-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-[14px] font-bold text-[var(--text-primary)]">
            Cycling Companion
          </span>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeScreenId;
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] ${
                  active
                    ? "bg-[var(--active-nav-bg)] font-semibold text-[var(--accent)]"
                    : "font-normal text-[var(--text-secondary)]"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
                />
                {item.label}
              </div>
            );
          })}
        </nav>

        {/* User */}
        <div className="mt-auto px-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-[11px] font-bold text-white">
              LM
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                Luis Miguel
              </p>
              <p className="truncate text-[11px] text-[var(--text-muted)]">luis.miguel@demo.app</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Content area */}
      <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
    </div>
  );
}
