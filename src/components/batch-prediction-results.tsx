import Link from "next/link";

import type { BatchPredictionResponse } from "@/lib/football/batch-predictions";

function kickoff(value: string): string {
  return new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos" }).format(new Date(value));
}

export function BatchPredictionResults({ result }: { result: BatchPredictionResponse }) {
  return (
    <section className="batch-results" aria-live="polite">
      <div className="batch-heading">
        <div><span className="section-kicker">Research results</span><h2>{result.predictions.length} ranked predictions</h2></div>
        <div><strong>{result.quota.dailyRemaining ?? "–"}</strong><span>API requests left</span></div>
      </div>
      <p className="batch-meta">Checked {result.attempted} fixtures · {result.unavailable} unavailable · {result.cached ? "served from cache" : "cached for five minutes"}</p>
      {result.warning ? <p className="batch-warning">{result.warning}</p> : null}
      {result.predictions.length ? <div className="batch-grid">{result.predictions.map((item, index) => (
        <Link className="batch-card" href={{ pathname: `/fixtures/${item.fixtureId}`, query: { home: item.home, away: item.away, league: item.league, kickoff: item.kickoff } }} key={item.fixtureId}>
          <div className="batch-card-top"><span>#{index + 1} · {item.league}</span><time>{kickoff(item.kickoff)}</time></div>
          <h3>{item.home} <small>vs</small> {item.away}</h3>
          <div className="batch-pick"><span>Suggested outcome</span><strong>{item.winner}</strong><b>{item.strength}% strongest signal</b></div>
          <div className="batch-percentages"><span>H {item.percentages.home}</span><span>D {item.percentages.draw}</span><span>A {item.percentages.away}</span></div>
          <p>{item.advice}</p>
          <small>Expected goals: {item.expectedGoals.home ?? "–"} — {item.expectedGoals.away ?? "–"}</small>
        </Link>
      ))}</div> : <div className="batch-empty">No supported predictions were found within the quota-safe search limit. Try another date later.</div>}
      <p className="batch-disclaimer">Predictions are statistical estimates, not guaranteed outcomes or financial advice.</p>
    </section>
  );
}
