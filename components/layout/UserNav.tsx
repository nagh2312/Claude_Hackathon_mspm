"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function UserNav() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const initial = (session?.user?.email?.[0] ?? session?.user?.name?.[0] ?? "?").toUpperCase();

  const onSignOut = useCallback(() => {
    void signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="relative flex items-center gap-3" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-sm font-bold text-violet-700 shadow-md ring-1 ring-white/60 transition hover:bg-white"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        {initial}
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-2 min-w-[200px] overflow-hidden rounded-2xl border border-white/20 bg-zinc-900/95 py-2 text-sm text-white shadow-xl backdrop-blur-md"
          role="menu"
        >
          <p className="truncate px-4 py-2 text-xs text-zinc-400">{session?.user?.email ?? "Your account"}</p>
          <Link
            href="/settings"
            className="block px-4 py-2.5 text-left text-zinc-100 hover:bg-white/10"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <button
            type="button"
            className="block w-full px-4 py-2.5 text-left text-rose-200 hover:bg-white/10"
            role="menuitem"
            onClick={onSignOut}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
