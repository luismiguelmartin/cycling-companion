export const NAV_ITEMS = [
  { iconName: "Activity" as const, label: "Dashboard", href: "/" },
  { iconName: "BarChart3" as const, label: "Actividades", href: "/activities" },
  { iconName: "Calendar" as const, label: "Planificación", href: "/plan" },
  { iconName: "TrendingUp" as const, label: "Insights", href: "/insights" },
  { iconName: "User" as const, label: "Perfil", href: "/profile" },
] as const;
