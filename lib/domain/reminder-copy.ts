/** Short, engaging lines for desktop + email nudges (not medical claims). */
export const JOURNAL_REMINDER_FACTS: string[] = [
  "Anne Frank's diary gave the world her inner life during extraordinary hardship — ordinary words can hold extraordinary truth.",
  "Marcus Aurelius journaled to steady his mind; many of those notes became Meditations, still read centuries later.",
  "Frida Kahlo's illustrated journals blended pain and colour — your page can hold contradictions too.",
  "Lewis and Clark kept detailed journals of their expedition; small daily notes became a map others could follow.",
  "Virginia Woolf's diaries captured creative weather, not just events — mood is valid material.",
  "Leonardo da Vinci's notebooks mixed sketches and questions — curiosity counts as journaling.",
  "Scientist Marie Curie's meticulous lab journals advanced trust in her work — clarity compounds over time.",
];

export function pickJournalReminderFact(): string {
  const i = Math.floor(Math.random() * JOURNAL_REMINDER_FACTS.length);
  return JOURNAL_REMINDER_FACTS[i] ?? JOURNAL_REMINDER_FACTS[0]!;
}

export function buildDesktopReminderBody(): string {
  const fact = pickJournalReminderFact();
  return `${fact}\n\nJournal now — even one sentence counts.`;
}
