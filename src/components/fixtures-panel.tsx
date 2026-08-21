"use client";

import { useEffect, useMemo, useState } from "react";

import type { Fixture, FixturesResponse } from "@/lib/football/fixtures";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: FixturesResponse }
  | { kind: "error"; message: string };

const statusGroups = [
  { value: "all", label: "All matches" },
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

const liveStatuses = new Set(["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"]);
const finishedStatuses = new Set(["FT", "AET", "PEN"]);

function statusGroup(fixture: Fixture): string {
  const status = fixture.fixture.status.short;
  if (liveStatuses.has(status)) return "live";
  if (finishedStatuses.has(status)) return "finished";
  return "scheduled";
}

function fixtureTime(isoDate: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(isoDate));
}

export function FixturesPanel() {
  const [date, setDate] = useState(() => new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()));
  const [league, setLeague] = useState("all");
  const [status, setStatus] = useState("all");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/fixtures?date=${encodeURIComponent(date)}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as FixturesResponse | { error?: string };
        if (!response.ok) {
          throw new Error("error" in payload && payload.error ? payload.error : "Unable to load fixtures.");
        }
        setState({ kind: "ready", data: payload as FixturesResponse });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setState({ kind: "error", message: error.message });
        }
      });

    return () => controller.abort();
  }, [date]);

  const fixtures = useMemo(() => state.kind === "ready" ? state.data.fixtures : [], [state]);
  const leagues = useMemo(() => {
    const unique = new Map(fixtures.map((fixture) => [fixture.league.id, fixture.league.name]));
    return [...unique].sort((a, b) => a[1].localeCompare(b[1]));
  }, [fixtures]);
  const filteredFixtures = useMemo(() => fixtures.filter((fixture) => (
    (league === "all" || String(fixture.league.id) === league)
    && (status === "all" || statusGroup(fixture) === status)
  )), [fixtures, league, status]);

  return (
    <section className="fixtures-section" id="fixtures">
      <div className="section-heading fixtures-heading">
        <div>
          <span className="section-kicker">Live API-Football data</span>
          <h2>Fixtures</h2>
        </div>
        <span className="fixture-count">{filteredFixtures.length} matches</span>
      </div>

      <div className="fixture-filters" aria-label="Fixture filters">
        <label>Date<input type="date" value={date} onChange={(event) => { setState({ kind: "loading" }); setDate(event.target.value); setLeague("all"); }} /></label>
        <label>League<select value={league} onChange={(event) => setLeague(event.target.value)}><option value="all">All leagues</option>{leagues.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}>{statusGroups.map((group) => <option key={group.value} value={group.value}>{group.label}</option>)}</select></label>
      </div>

      {state.kind === "loading" ? <div className="fixture-state" role="status">Loading fixtures…</div> : null}
      {state.kind === "error" ? <div className="fixture-state error" role="alert">{state.message}</div> : null}
      {state.kind === "ready" && filteredFixtures.length === 0 ? <div className="fixture-state">No matches match these filters.</div> : null}
      {state.kind === "ready" && filteredFixtures.length > 0 ? (
        <div className="fixtures-list">
          {filteredFixtures.map((item) => (
            <article className="fixture-row" key={item.fixture.id}>
              <div className="fixture-meta"><strong>{item.league.name}</strong><span>{item.league.country} · {item.league.round}</span></div>
              <div className="fixture-teams"><span>{item.teams.home.name}</span><b>{item.goals.home ?? "–"} : {item.goals.away ?? "–"}</b><span>{item.teams.away.name}</span></div>
              <div className={`fixture-status ${statusGroup(item)}`}><strong>{fixtureTime(item.fixture.date)}</strong><span>{item.fixture.status.long}</span></div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
