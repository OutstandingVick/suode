import Link from "next/link";

import type { BatchPredictionResponse } from "@/lib/football/batch-predictions";

function kickoff(value: string): { date: string; time: string } {
  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }).format(date),
    time: new Intl.DateTimeFormat("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(date),
  };
}

export function BatchPredictionResults({ result }: { result: BatchPredictionResponse }) {
  return (
    <section className="batch-results" aria-live="polite">
      <div className="batch-heading">
        <div><span className="section-kicker">Research results</span><h2>{result.predictions.length} of {result.requested} requested predictions</h2></div>
        <div><strong>{result.quota.dailyRemaining ?? "–"}</strong><span>API requests left</span></div>
      </div>
      <p className="batch-meta">Checked {result.attempted} fixtures · {result.unavailable} unavailable · {result.cached ? "served from cache" : "cached for five minutes"}</p>
      {result.warning ? <p className="batch-warning">{result.warning}</p> : null}
      {result.predictions.length ? <div className="batch-grid">{result.predictions.map((item, index) => {
        const scheduled = kickoff(item.kickoff);
        return (
        <Link className="batch-card" href={{ pathname: `/fixtures/${item.fixtureId}`, query: { home: item.home, away: item.away, league: item.league, kickoff: item.kickoff } }} key={item.fixtureId}>
          <div className="batch-card-top"><span>#{index + 1} · {item.league}</span><time dateTime={item.kickoff}><b>{scheduled.date}</b>{scheduled.time}</time></div>
          <h3>{item.home} <small>vs</small> {item.away}</h3>
          <div className="batch-pick"><span>Suggested outcome</span><strong>{item.winner}</strong><b>{item.strength}% strongest signal</b></div>
          <div className="batch-percentages"><span>H {item.percentages.home}</span><span>D {item.percentages.draw}</span><span>A {item.percentages.away}</span></div>
          <p>{item.advice}</p>
          <small>Expected goals: {item.expectedGoals.home ?? "–"} — {item.expectedGoals.away ?? "–"}</small>
        </Link>
      );})}</div> : <div className="batch-empty">No upcoming supported predictions were found within the quota-safe search limit. Try again when more fixtures are scheduled.</div>}
      <p className="batch-disclaimer">Predictions are statistical estimates, not guaranteed outcomes or financial advice.</p>
    </section>
  );
}
