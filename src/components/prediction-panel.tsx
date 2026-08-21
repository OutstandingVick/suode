"use client";

import { useEffect, useState } from "react";

import type { PredictionResponse } from "@/lib/football/predictions";
import { DeepResearchPanel } from "@/components/deep-research-panel";
import { LocalTicketButton } from "@/components/local-ticket-button";

type PredictionState =
  | { kind: "loading" }
  | { kind: "ready"; data: PredictionResponse }
  | { kind: "error"; message: string };

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

export function PredictionPanel({ fixtureId }: { fixtureId: number }) {
  const [state, setState] = useState<PredictionState>({ kind: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/predictions/${fixtureId}`, { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json() as PredictionResponse | { error?: string };
        if (!response.ok) {
          throw new Error("error" in payload && payload.error ? payload.error : "Unable to load this prediction.");
        }
        setState({ kind: "ready", data: payload as PredictionResponse });
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setState({ kind: "error", message: error.message });
        }
      });

    return () => controller.abort();
  }, [fixtureId, reloadToken]);

  if (state.kind === "loading") {
    return <section className="prediction-placeholder prediction-loading" role="status">Researching this match…</section>;
  }

  if (state.kind === "error") {
    return (
      <section className="prediction-placeholder prediction-error" role="alert">
        <span>Prediction unavailable</span>
        <h2>Suode could not research this match</h2>
        <p>{state.message}</p>
        <button type="button" onClick={() => { setState({ kind: "loading" }); setReloadToken((value) => value + 1); }}>Try again</button>
      </section>
    );
  }

  const { prediction, evidence, quota } = state.data;
  const pick = prediction.predictions;

  return (
    <div className="prediction-results">
      <section className="prediction-summary">
        <div>
          <span className="prediction-label">Suggested outcome</span>
          <h2>{pick.winner.name ?? "No clear winner"}</h2>
          <p>{pick.winner.comment ?? pick.advice}</p>
        </div>
        <div className="prediction-advice">
          <span>API-Football advice</span>
          <strong>{pick.advice}</strong>
          <small>Expected goals: {pick.goals.home ?? "–"} — {pick.goals.away ?? "–"}{pick.under_over ? ` · ${pick.under_over}` : ""}</small>
        </div>
      </section>

      <LocalTicketButton match={{
        fixtureId,
        home: prediction.teams.home.name,
        away: prediction.teams.away.name,
        league: prediction.league.name,
        prediction: pick.winner.name ?? "No clear winner",
        advice: pick.advice,
      }} />

      <section className="probability-card">
        <h3>Outcome comparison</h3>
        <div className="probability-grid">
          <div><span>{prediction.teams.home.name}</span><strong>{pick.percent.home}</strong></div>
          <div><span>Draw</span><strong>{pick.percent.draw}</strong></div>
          <div><span>{prediction.teams.away.name}</span><strong>{pick.percent.away}</strong></div>
        </div>
      </section>

      <section className="evidence-grid">
        {[evidence.homeForm, evidence.awayForm].map((form) => (
          <article className="form-evidence" key={form.team}>
            <span>Last five form</span>
            <h3>{form.team}</h3>
            <code>{form.form ?? "Not available"}</code>
            <dl>
              <div><dt>Attack</dt><dd>{form.attack ?? "–"}</dd></div>
              <div><dt>Defence</dt><dd>{form.defence ?? "–"}</dd></div>
              <div><dt>Goals scored avg.</dt><dd>{form.goalsForAverage ?? "–"}</dd></div>
              <div><dt>Goals conceded avg.</dt><dd>{form.goalsAgainstAverage ?? "–"}</dd></div>
            </dl>
          </article>
        ))}
      </section>

      <section className="h2h-card">
        <div><span className="prediction-label">Evidence</span><h3>Recent head-to-head</h3></div>
        {evidence.headToHead.length ? (
          <div className="h2h-list">{evidence.headToHead.map((match) => (
            <div key={match.fixtureId}>
              <time>{formatDate(match.date)}</time>
              <span>{match.home}</span>
              <strong>{match.homeGoals ?? "–"} : {match.awayGoals ?? "–"}</strong>
              <span>{match.away}</span>
            </div>
          ))}</div>
        ) : <p>No recent meetings were supplied for these teams.</p>}
      </section>

      <aside className="prediction-disclaimer" aria-label="Prediction limitations">
        <strong>Use predictions responsibly</strong>
        <p>These are statistical estimates supplied by API-Football, not guaranteed outcomes or financial advice. Team news, line-ups, conditions, and late changes may not be reflected. Review the evidence and never stake more than you can afford to lose.</p>
      </aside>

      <DeepResearchPanel fixtureId={fixtureId} />

      {quota.dailyRemaining !== null ? <p className="prediction-quota">API quota remaining: {quota.dailyRemaining}{quota.dailyLimit !== null ? ` / ${quota.dailyLimit}` : ""} · Cached for 30 minutes</p> : null}
    </div>
  );
}
