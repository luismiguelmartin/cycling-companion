"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Upload } from "lucide-react";
import { ACTIVITY_FILTERS, type ActivityFilterKey } from "shared";
import Link from "next/link";
import { ActivityListItem } from "@/components/activity-list-item";
import { formatDuration } from "@/lib/dashboard/calculations";

interface ActivityRow {
  id: string;
  name: string;
  date: string;
  type: string;
  distance_km: number | null;
  duration_seconds: number;
  avg_power_watts: number | null;
  avg_hr_bpm: number | null;
  rpe: number | null;
}

interface ActivitiesContentProps {
  activities: ActivityRow[];
}

const filterKeys = Object.keys(ACTIVITY_FILTERS) as ActivityFilterKey[];

export function ActivitiesContent({ activities }: ActivitiesContentProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActivityFilterKey>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeFilter === "all" || a.type === activeFilter;
      return matchesSearch && matchesType;
    });
  }, [activities, searchQuery, activeFilter]);

  const isFilterActive = activeFilter !== "all";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] md:text-[26px]">
            Actividades
          </h1>
          <p className="text-[11px] text-[var(--text-muted)] md:text-[13px]">
            {activities.length} registradas
          </p>
        </div>
        <Link
          href="/activities/import"
          className="flex items-center gap-1.5 rounded-[10px] px-3 py-[7px] text-[12px] font-semibold text-white md:px-[18px] md:py-[9px] md:text-[13px]"
          style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}
        >
          <Upload className="h-3.5 w-3.5" />
          Importar
        </Link>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-[var(--input-border)] bg-[var(--input-bg)] px-3">
          <Search className="h-[15px] w-[15px] shrink-0 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Buscar actividades"
            role="searchbox"
            className="w-full bg-transparent py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center rounded-[10px] border px-3 py-[9px] text-[12px] transition-colors"
          style={{
            backgroundColor:
              showFilters || isFilterActive ? "var(--active-nav-bg)" : "var(--input-bg)",
            borderColor:
              showFilters || isFilterActive ? "rgba(249,115,22,0.4)" : "var(--input-border)",
            color: showFilters || isFilterActive ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <Filter className="h-[13px] w-[13px]" />
        </button>
      </div>

      {/* Filter chips */}
      {showFilters && (
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Filtrar por tipo">
          {filterKeys.map((key) => {
            const filter = ACTIVITY_FILTERS[key];
            const isActive = activeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFilter(key)}
                role="radio"
                aria-checked={isActive}
                className="rounded-[7px] border px-2.5 py-1 text-[11px] font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--active-nav-bg)" : "var(--input-bg)",
                  borderColor: isActive ? "rgba(249,115,22,0.4)" : "var(--input-border)",
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Activities list */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] py-16 text-center">
          <p className="text-[14px] text-[var(--text-muted)]">
            Aún no tienes actividades. ¡Importa tu primera sesión!
          </p>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] py-16 text-center">
          <p className="text-[14px] text-[var(--text-muted)]">No se encontraron actividades.</p>
        </div>
      ) : (
        <div>
          {filteredActivities.map((activity) => (
            <ActivityListItem
              key={activity.id}
              id={activity.id}
              name={activity.name}
              date={activity.date}
              type={activity.type}
              distanceKm={activity.distance_km}
              durationFormatted={formatDuration(activity.duration_seconds)}
              avgPower={activity.avg_power_watts}
              avgHR={activity.avg_hr_bpm}
              rpe={activity.rpe}
            />
          ))}
        </div>
      )}
    </div>
  );
}
