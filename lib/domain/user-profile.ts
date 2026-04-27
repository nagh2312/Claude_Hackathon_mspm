export type MascotArchetype = "explorer" | "zen" | "planner" | "spark";

export interface UserPersonalityProfile {
  onboardingComplete: boolean;
  archetype: MascotArchetype;
  tags: string[];
  updatedAt: string;
}
