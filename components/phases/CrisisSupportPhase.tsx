"use client";

import { CRISIS_RESOURCES, CRISIS_SUPPORT_COPY } from "@/lib/domain/crisis-resources";

export function CrisisSupportPhase() {
  return (
    <section className="space-y-8">
      <header className="space-y-4 rounded-3xl bg-rose-50/80 p-8 ring-1 ring-rose-100">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">Phase 4b — Support path</p>
        <h2 className="font-display text-3xl text-rose-950 sm:text-4xl">{CRISIS_SUPPORT_COPY.title}</h2>
        <p className="max-w-2xl text-lg leading-relaxed text-rose-900/90">{CRISIS_SUPPORT_COPY.lead}</p>
        <p className="text-sm text-rose-800/80">{CRISIS_SUPPORT_COPY.footer}</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {CRISIS_RESOURCES.map((r) => (
          <li
            key={r.name}
            className="flex flex-col justify-between rounded-2xl border border-rose-100 bg-white p-5 shadow-sm"
          >
            <div className="space-y-2">
              <h3 className="font-semibold text-zinc-900">{r.name}</h3>
              <p className="text-sm text-zinc-600">{r.detail}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {r.phone ? (
                <a
                  className="rounded-full bg-rose-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-rose-800"
                  href={`tel:${r.phone.replace(/\s/g, "")}`}
                >
                  Call {r.phone}
                </a>
              ) : null}
              {r.href ? (
                <a
                  className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-800 hover:bg-zinc-50"
                  href={r.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open link
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
