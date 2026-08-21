"use client";

import { useState } from "react";

import type { DeepResearchResponse } from "@/lib/football/research";

type State = { kind: "idle" } | { kind: "loading" } | { kind: "ready"; data: DeepResearchResponse } | { kind: "error"; message: string };

export function DeepResearchPanel({ fixtureId }: { fixtureId: number }) {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function loadResearch() {
    setState({ kind: "loading" });
    try {
      const response = await fetch(`/api/research/${fixtureId}`);
      const payload = await response.json() as DeepResearchResponse | { error?: string };
      if (!response.ok) throw new Error("error" in payload && payload.error ? payload.error : "Deep research failed.");
      setState({ kind: "ready", data: payload as DeepResearchResponse });
    } catch (error) {
      setState({ kind: "error", message: error instanceof Error ? error.message : "Deep research failed." });
    }
  }

  if (state.kind === "idle") return <button className="deep-research-button" type="button" onClick={loadResearch}>Run deep research <small>about 1 extra request</small></button>;
  if (state.kind === "loading") return <div className="deep-research-state" role="status">Loading standings…</div>;
  if (state.kind === "error") return <div className="deep-research-state error" role="alert"><span>{state.message}</span><button type="button" onClick={loadResearch}>Try again</button></div>;

  return (
    <section className="deep-research-results">
      <div className="deep-heading"><div><span className="prediction-label">Deep research</span><h3>League standings</h3></div><small>{state.data.quota.dailyRemaining ?? "–"} API requests remaining</small></div>
      {state.data.standings.length ? <div className="standing-grid">{state.data.standings.map((team) => (
        <article key={team.teamId}>
          <span>Position</span><strong>#{team.rank}</strong><h4>{team.team}</h4>
          <p>{team.points} pts · {team.played} played · {team.won}W {team.drawn}D {team.lost}L</p>
          <code>{team.form ?? "Form unavailable"}</code>
        </article>
      ))}</div> : <p className="research-empty">Standings are unavailable for this competition.</p>}
    </section>
  );
}
