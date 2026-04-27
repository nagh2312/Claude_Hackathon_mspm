import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getUserProfile, saveUserProfile } from "@/lib/server/profile-store";
import type { MascotArchetype, UserPersonalityProfile } from "@/lib/domain/user-profile";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const profile = await getUserProfile(userId);
  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      onboardingComplete?: boolean;
      archetype?: MascotArchetype;
      tags?: string[];
    };
    const archetypes: MascotArchetype[] = ["explorer", "zen", "planner", "spark"];
    const archetype = archetypes.includes(body.archetype as MascotArchetype)
      ? (body.archetype as MascotArchetype)
      : "explorer";
    const profile: UserPersonalityProfile = {
      onboardingComplete: Boolean(body.onboardingComplete),
      archetype,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 12) : [],
      updatedAt: new Date().toISOString(),
    };
    await saveUserProfile(userId, profile);
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Could not save profile." }, { status: 400 });
  }
}
