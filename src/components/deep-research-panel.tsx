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

  if (state.kind === "idle") return <button className="deep-research-button" type="button" onClick={loadResearch}>Run deep research <small>about 5 extra requests</small></button>;
  if (state.kind === "loading") return <div className="deep-research-state" role="status">Loading standings and availability…</div>;
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
      <div className="research-subheading"><span className="prediction-label">Availability</span><h3>Injuries and absences</h3></div>
      {state.data.injuries.length ? <div className="injury-list">{state.data.injuries.map((injury) => (
        <div key={`${injury.teamId}-${injury.playerId}`}><strong>{injury.player}</strong><span>{injury.team}</span><small>{injury.type}: {injury.reason}</small></div>
      ))}</div> : <p className="research-empty">No injuries or absences were supplied for this fixture.</p>}
      <div className="research-subheading"><span className="prediction-label">Team selection</span><h3>Line-ups</h3></div>
      {state.data.lineups.length ? <div className="lineup-grid">{state.data.lineups.map((lineup) => (
        <article key={lineup.teamId}>
          <div><h4>{lineup.team}</h4><span>{lineup.formation ?? "Formation TBC"} · {lineup.coach ?? "Coach unavailable"}</span></div>
          <ol>{lineup.startingEleven.map((player) => <li key={player.playerId}><b>{player.number ?? "–"}</b><span>{player.name}</span><small>{player.position}</small></li>)}</ol>
        </article>
      ))}</div> : <p className="research-empty">Line-ups have not been announced for this fixture.</p>}
      <div className="research-subheading"><span className="prediction-label">Venue split</span><h3>Home and away performance</h3></div>
      <div className="venue-grid">{state.data.venuePerformance.map((record) => (
        <article key={`${record.teamId}-${record.venue}`}>
          <span>{record.venue} record</span><h4>{record.team}</h4>
          <strong>{record.won}W · {record.drawn}D · {record.lost}L</strong>
          <p>{record.played} played · {record.goalsForAverage ?? "–"} scored/game · {record.goalsAgainstAverage ?? "–"} conceded/game</p>
          <small>{record.cleanSheets} clean sheets · failed to score {record.failedToScore} times</small>
        </article>
      ))}</div>
    </section>
  );
}
