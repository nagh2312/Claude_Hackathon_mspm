"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { buildDesktopReminderBody } from "@/lib/domain/reminder-copy";
import { readLastJournalActivity } from "@/lib/services/persistence";

const REMINDER_ENABLED_KEY = "reflection-journal-desktop-reminder";
const REMINDER_HOUR_KEY = "reflection-journal-reminder-hour";

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDay(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function msUntilNextLocalHour(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 5, 0);
  if (next.getTime() <= now.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next.getTime() - now.getTime();
}

export function useJournalReminders() {
  const [enabled, setEnabled] = useState(false);
  const [hour, setHour] = useState(18);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEnabled(window.localStorage.getItem(REMINDER_ENABLED_KEY) === "1");
    const h = Number(window.localStorage.getItem(REMINDER_HOUR_KEY));
    if (!Number.isNaN(h) && h >= 0 && h <= 23) setHour(h);
    if (!("Notification" in window)) setPermission("unsupported");
    else setPermission(Notification.permission);
  }, []);

  const persistEnabled = useCallback((next: boolean) => {
    setEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMINDER_ENABLED_KEY, next ? "1" : "0");
    }
  }, []);

  const persistHour = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(23, Math.round(next)));
    setHour(clamped);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(REMINDER_HOUR_KEY, String(clamped));
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    const res = await Notification.requestPermission();
    setPermission(res);
    return res;
  }, []);

  const maybeNotify = useCallback(() => {
    if (!enabled || permission !== "granted") return;
    const last = parseLocalDay(readLastJournalActivity());
    const today = todayLocal();
    if (last === today) return;
    try {
      const body = buildDesktopReminderBody();
      new Notification("Mind Canvas: gentle nudge", { body });
    } catch {
      /* ignore */
    }
  }, [enabled, permission]);

  useEffect(() => {
    if (!enabled || permission !== "granted") {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }
    const schedule = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const delay = msUntilNextLocalHour(hour);
      timerRef.current = setTimeout(() => {
        maybeNotify();
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, hour, permission, maybeNotify]);

  return {
    enabled,
    setEnabled: persistEnabled,
    hour,
    setHour: persistHour,
    permission,
    requestPermission,
    sendTestNotification: () => {
      if (permission !== "granted") return;
      const body = buildDesktopReminderBody();
      new Notification("Mind Canvas: test nudge", { body });
    },
  };
}
