import type { Metadata } from "next";
import { requireUserId } from "@/lib/session";
import { getProfile } from "@/lib/data/profile";
import { ProfileForm } from "@/components/profile/ProfileForm";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const userId = await requireUserId();
  const profile = await getProfile(userId);
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-8 lg:px-12 py-6 sm:py-10 animate-fade-in-up">
      <ProfileForm profile={profile ? { resumeText: profile.resumeText, linkedInAbout: profile.linkedInAbout, linkedInUrl: profile.linkedInUrl } : null} />
    </div>
  );
}
