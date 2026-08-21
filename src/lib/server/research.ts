import "server-only";

import type { DeepResearchResponse, InjuryEvidence, LineupEvidence, ResearchInsight, StandingEvidence, VenuePerformanceEvidence } from "@/lib/football/research";
import { apiFootballGet } from "@/lib/server/api-football";
import { getPrediction } from "@/lib/server/predictions";

type StandingRow = {
  rank: number;
  team: { id: number; name: string };
  points: number;
  goalsDiff: number;
  form: string | null;
  all: { played: number; win: number; draw: number; lose: number };
};

type StandingLeague = { league: { standings: StandingRow[][] } };
type InjuryRow = {
  team: { id: number; name: string };
  player: { id: number; name: string; type: string; reason: string };
};
type LineupRow = {
  team: { id: number; name: string };
  formation: string | null;
  coach: { name: string | null };
  startXI: Array<{ player: { id: number; name: string; number: number | null; pos: string } }>;
};
type TeamStatistics = {
  team: { id: number; name: string };
  fixtures: {
    played: { home: number; away: number };
    wins: { home: number; away: number };
    draws: { home: number; away: number };
    loses: { home: number; away: number };
  };
  goals: {
    for: { average: { home: string | null; away: string | null } };
    against: { average: { home: string | null; away: string | null } };
  };
  clean_sheet: { home: number; away: number };
  failed_to_score: { home: number; away: number };
};

const RESEARCH_CACHE_SECONDS = 3600;

export async function getDeepResearch(fixtureId: number): Promise<DeepResearchResponse> {
  const predictionResult = await getPrediction(fixtureId);
  const { prediction } = predictionResult;
  const [standingResult, injuryResult, lineupResult, homeStatsResult, awayStatsResult] = await Promise.all([
    apiFootballGet<StandingLeague[]>(
      "standings",
      { league: prediction.league.id, season: prediction.league.season },
      { cacheSeconds: RESEARCH_CACHE_SECONDS },
    ),
    apiFootballGet<InjuryRow[]>(
      "injuries",
      { fixture: fixtureId },
      { cacheSeconds: RESEARCH_CACHE_SECONDS },
    ),
    apiFootballGet<LineupRow[]>(
      "fixtures/lineups",
      { fixture: fixtureId },
      { cacheSeconds: RESEARCH_CACHE_SECONDS },
    ),
    apiFootballGet<TeamStatistics>(
      "teams/statistics",
      { league: prediction.league.id, season: prediction.league.season, team: prediction.teams.home.id },
      { cacheSeconds: RESEARCH_CACHE_SECONDS },
    ),
    apiFootballGet<TeamStatistics>(
      "teams/statistics",
      { league: prediction.league.id, season: prediction.league.season, team: prediction.teams.away.id },
      { cacheSeconds: RESEARCH_CACHE_SECONDS },
    ),
  ]);
  const rows = standingResult.data.flatMap((entry) => entry.league.standings.flat());
  const teamIds = new Set([prediction.teams.home.id, prediction.teams.away.id]);
  const standings = rows.filter((row) => teamIds.has(row.team.id)).map(toStandingEvidence);
  const injuries = injuryResult.data.map(toInjuryEvidence);
  const lineups = lineupResult.data.map(toLineupEvidence);
  const venuePerformance = [
    toVenuePerformance(homeStatsResult.data, "home"),
    toVenuePerformance(awayStatsResult.data, "away"),
  ];

  return {
    fixtureId,
    standings,
    injuries,
    lineups,
    venuePerformance,
    insights: buildInsights(standings, injuries, lineups, venuePerformance),
    dataQuality: buildDataQuality(
      standings,
      injuries,
      lineups,
      venuePerformance,
      prediction.h2h.length,
    ),
    quota: {
      dailyLimit: awayStatsResult.quota.dailyLimit ?? homeStatsResult.quota.dailyLimit ?? lineupResult.quota.dailyLimit,
      dailyRemaining: awayStatsResult.quota.dailyRemaining ?? homeStatsResult.quota.dailyRemaining ?? lineupResult.quota.dailyRemaining,
    },
  };
}

function buildDataQuality(
  standings: StandingEvidence[],
  injuries: InjuryEvidence[],
  lineups: LineupEvidence[],
  venue: VenuePerformanceEvidence[],
  headToHeadCount: number,
): DeepResearchResponse["dataQuality"] {
  let score = 10; // A valid API prediction is available.
  const missing: string[] = [];

  if (standings.length >= 2) score += 25;
  else missing.push("Complete standings for both teams");

  if (venue.length >= 2 && venue.every((record) => record.played > 0)) score += 25;
  else missing.push("Sufficient home and away match samples");

  if (lineups.length >= 2 && lineups.every((lineup) => lineup.startingEleven.length >= 11)) score += 25;
  else if (lineups.length) { score += 10; missing.push("A complete starting XI for both teams"); }
  else missing.push("Confirmed or predicted line-ups");

  if (headToHeadCount >= 3) score += 10;
  else missing.push("At least three recent head-to-head matches");

  if (injuries.length) score += 5;
  else missing.push("Verified player-availability reports");

  return {
    score,
    grade: score >= 80 ? "High" : score >= 55 ? "Medium" : "Low",
    missing,
  };
}

function buildInsights(
  standings: StandingEvidence[],
  injuries: InjuryEvidence[],
  lineups: LineupEvidence[],
  venue: VenuePerformanceEvidence[],
): ResearchInsight[] {
  const insights: ResearchInsight[] = [];
  const ordered = [...standings].sort((a, b) => a.rank - b.rank);
  if (ordered.length === 2) {
    const gap = ordered[1].rank - ordered[0].rank;
    insights.push({
      label: "Table position",
      text: gap === 0 ? "The teams are level in the table." : `${ordered[0].team} sit ${gap} place${gap === 1 ? "" : "s"} above ${ordered[1].team}.`,
      tone: gap >= 5 ? "positive" : "neutral",
    });
  }

  for (const record of venue) {
    const games = Math.max(record.played, 1);
    const winRate = Math.round((record.won / games) * 100);
    insights.push({
      label: `${record.venue === "home" ? "Home" : "Away"} record`,
      text: `${record.team} have won ${winRate}% of their ${record.venue} league matches (${record.won} of ${record.played}).`,
      tone: winRate >= 60 ? "positive" : winRate <= 30 ? "caution" : "neutral",
    });
  }

  const injuriesByTeam = new Map<string, number>();
  for (const injury of injuries) injuriesByTeam.set(injury.team, (injuriesByTeam.get(injury.team) ?? 0) + 1);
  for (const [team, count] of injuriesByTeam) {
    insights.push({ label: "Availability", text: `${team} have ${count} reported unavailable player${count === 1 ? "" : "s"}.`, tone: "caution" });
  }

  insights.push({
    label: "Line-ups",
    text: lineups.length >= 2 ? "Starting line-ups are available for both teams." : "At least one starting line-up is still unavailable.",
    tone: lineups.length >= 2 ? "positive" : "neutral",
  });
  return insights;
}

function toVenuePerformance(stats: TeamStatistics, venue: "home" | "away"): VenuePerformanceEvidence {
  return {
    teamId: stats.team.id,
    team: stats.team.name,
    venue,
    played: stats.fixtures.played[venue],
    won: stats.fixtures.wins[venue],
    drawn: stats.fixtures.draws[venue],
    lost: stats.fixtures.loses[venue],
    goalsForAverage: stats.goals.for.average[venue],
    goalsAgainstAverage: stats.goals.against.average[venue],
    cleanSheets: stats.clean_sheet[venue],
    failedToScore: stats.failed_to_score[venue],
  };
}

function toLineupEvidence(row: LineupRow): LineupEvidence {
  return {
    teamId: row.team.id,
    team: row.team.name,
    formation: row.formation,
    coach: row.coach?.name ?? null,
    startingEleven: row.startXI.map(({ player }) => ({
      playerId: player.id,
      name: player.name,
      position: player.pos,
      number: player.number,
    })),
  };
}

function toInjuryEvidence(row: InjuryRow): InjuryEvidence {
  return {
    teamId: row.team.id,
    team: row.team.name,
    playerId: row.player.id,
    player: row.player.name,
    type: row.player.type,
    reason: row.player.reason,
  };
}

function toStandingEvidence(row: StandingRow): StandingEvidence {
  return {
    teamId: row.team.id,
    team: row.team.name,
    rank: row.rank,
    points: row.points,
    played: row.all.played,
    won: row.all.win,
    drawn: row.all.draw,
    lost: row.all.lose,
    goalsDiff: row.goalsDiff,
    form: row.form,
  };
}
