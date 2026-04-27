import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getUserProfile } from "@/lib/server/profile-store";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  const profile = await getUserProfile(session.user.id);
  if (!profile?.onboardingComplete) {
    redirect("/onboarding");
  }
  redirect("/home");
}
