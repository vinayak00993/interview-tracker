import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findUserProfile } from "@/lib/db";
import ProfileForm from "./ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const profile = await findUserProfile(userId);

  return <ProfileForm profile={profile || null} />;
}
