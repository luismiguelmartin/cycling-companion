import { redirect } from "next/navigation";
import type { StravaConnectionStatus } from "shared";
import { apiGet, getServerToken } from "@/lib/api/server";
import { ProfileContent } from "./profile-content";

interface ProfileData {
  id: string;
  email: string;
  display_name: string;
  age: number;
  weight_kg: number;
  ftp: number | null;
  max_hr: number | null;
  rest_hr: number | null;
  goal: string;
}

const DEFAULT_STRAVA_STATUS: StravaConnectionStatus = {
  connected: false,
  athlete_name: null,
  strava_athlete_id: null,
  connected_at: null,
  last_sync_at: null,
  activities_count: 0,
};

export default async function ProfilePage() {
  const token = await getServerToken();
  if (!token) {
    redirect("/login");
  }

  let profile: ProfileData;
  try {
    const res = await apiGet<{ data: ProfileData }>("/profile", token);
    profile = res.data;
  } catch {
    redirect("/onboarding");
  }

  let stravaStatus: StravaConnectionStatus;
  try {
    const res = await apiGet<{ data: StravaConnectionStatus }>("/strava/status", token);
    stravaStatus = res.data;
  } catch {
    stravaStatus = DEFAULT_STRAVA_STATUS;
  }

  return <ProfileContent profile={profile} stravaStatus={stravaStatus} />;
}
