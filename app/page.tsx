import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { getUserProfile } from "@/lib/server/profile-store";

/** Session reads cookies/headers; must not be statically prerendered. */
export const dynamic = "force-dynamic";

export default async function RootPage() {
  let session = null;
  try {
    session = await getServerSession(authOptions);
  } catch {
    // Bad/expired JWT, missing NEXTAUTH_SECRET on server, or rotated secret: send user to sign in again.
    redirect("/login");
  }

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile?.onboardingComplete) {
    redirect("/onboarding");
  }
  redirect("/home");
}
