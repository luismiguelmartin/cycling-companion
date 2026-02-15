import { redirect } from "next/navigation";
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

  return <ProfileContent profile={profile} />;
}
