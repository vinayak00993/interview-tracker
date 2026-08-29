import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findUserProfile } from "@/lib/db";
import ProfileForm from "./ProfileForm";
import MobileTabBar from "@/components/MobileTabBar";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id;
  const profile = await findUserProfile(userId);

  return (
    <>
      <div className="pb-24 md:pb-0">
        <ProfileForm profile={profile || null} />
      </div>
      <MobileTabBar />
    </>
  );
}
