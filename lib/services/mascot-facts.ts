/** Short, friendly nuggets for the companion character (no clinical claims). */
export const MASCOT_FACTS: string[] = [
  "Jotting down one sentence still counts as showing up for yourself.",
  "Brains often feel clearer after we name a feeling, even if nothing else changes yet.",
  "Your future self rarely minds reading an imperfect page from today.",
  "Small routines beat perfect plans when energy is low.",
  "Noticing one color or sound on the way home can anchor a heavy day.",
  "Pausing for three slow breaths can lower the volume on anxious thoughts.",
  "Writing by hand and typing use different muscles, literally and mentally.",
  "Gratitude lists do not erase hard things; they widen the picture a little.",
  "Sleep and mood are neighbors; when one wobbles, the other often knocks.",
  "You are allowed to write the same worry twice; repetition is not failure.",
];

export function randomMascotFact(seed?: number): string {
  const i = seed != null ? seed % MASCOT_FACTS.length : Math.floor(Math.random() * MASCOT_FACTS.length);
  return MASCOT_FACTS[i] ?? MASCOT_FACTS[0];
}
