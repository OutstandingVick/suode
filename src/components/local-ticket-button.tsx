"use client";

import { useMemo, useSyncExternalStore } from "react";

const STORAGE_KEY = "suode:research-ticket";
const STORAGE_EVENT = "suode-ticket-change";

export type TicketMatch = {
  fixtureId: number;
  home: string;
  away: string;
  league: string;
  prediction: string;
  advice: string;
  savedAt: string;
};

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(STORAGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(STORAGE_EVENT, callback);
  };
}

function snapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? "[]";
}

function readTicket(serialized: string): TicketMatch[] {
  try {
    const parsed: unknown = JSON.parse(serialized);
    return Array.isArray(parsed) ? parsed as TicketMatch[] : [];
  } catch {
    return [];
  }
}

export function LocalTicketButton({ match }: { match: Omit<TicketMatch, "savedAt"> }) {
  const serialized = useSyncExternalStore(subscribe, snapshot, () => "[]");
  const ticket = useMemo(() => readTicket(serialized), [serialized]);
  const saved = ticket.some((item) => item.fixtureId === match.fixtureId);

  function toggleSaved() {
    const next = saved
      ? ticket.filter((item) => item.fixtureId !== match.fixtureId)
      : [...ticket, { ...match, savedAt: new Date().toISOString() }];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  }

  return (
    <button className={`ticket-save-button ${saved ? "saved" : ""}`} type="button" onClick={toggleSaved}>
      {saved ? "✓ Saved to local ticket" : "+ Save to research ticket"}
    </button>
  );
}
