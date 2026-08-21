import Link from "next/link";
import { notFound } from "next/navigation";

function queryValue(value: string | string[] | undefined, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export default async function FixturePage({ params, searchParams }: PageProps<"/fixtures/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  if (!/^\d+$/.test(id)) notFound();

  const home = queryValue(query.home, "Home team");
  const away = queryValue(query.away, "Away team");
  const league = queryValue(query.league, "Competition");
  const kickoff = queryValue(query.kickoff, "");

  return (
    <main className="match-page">
      <Link className="match-back" href="/#fixtures">← Back to fixtures</Link>
      <section className="match-hero">
        <span className="section-kicker">{league}</span>
        <p>{kickoff ? new Intl.DateTimeFormat("en-NG", { dateStyle: "full", timeStyle: "short", timeZone: "Africa/Lagos" }).format(new Date(kickoff)) : `Fixture ${id}`}</p>
        <div className="match-teams">
          <h1>{home}</h1>
          <span>vs</span>
          <h1>{away}</h1>
        </div>
      </section>
      <section className="prediction-placeholder">
        <span>Prediction workspace</span>
        <h2>Match research will appear here</h2>
        <p>This match page is ready for API-Football predictions and supporting evidence.</p>
      </section>
    </main>
  );
}
