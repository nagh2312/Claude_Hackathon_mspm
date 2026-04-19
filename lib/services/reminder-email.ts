import { pickJournalReminderFact } from "@/lib/domain/reminder-copy";

export function buildJournalReminderEmail(): { subject: string; html: string } {
  const fact = pickJournalReminderFact();
  const subject = "A small nudge to journal today ✦";
  const html = `
  <div style="font-family:Georgia,serif;line-height:1.6;color:#1f2937;max-width:560px;margin:0 auto;padding:24px;">
    <p style="font-size:18px;margin:0 0 12px;">Hi there,</p>
    <p style="margin:0 0 12px;">${fact}</p>
    <p style="margin:0 0 20px;">If you have two quiet minutes, your future self often appreciates a honest line or two — not polished, just true.</p>
    <p style="margin:0;font-size:14px;color:#6b7280;">— Reflection Journal</p>
  </div>`;
  return { subject, html };
}
