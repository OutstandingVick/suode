import "server-only";

import type { DeepResearchResponse, InjuryEvidence, LineupEvidence, StandingEvidence, VenuePerformanceEvidence } from "@/lib/football/research";
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

  return {
    fixtureId,
    standings: rows.filter((row) => teamIds.has(row.team.id)).map(toStandingEvidence),
    injuries: injuryResult.data.map(toInjuryEvidence),
    lineups: lineupResult.data.map(toLineupEvidence),
    venuePerformance: [
      toVenuePerformance(homeStatsResult.data, "home"),
      toVenuePerformance(awayStatsResult.data, "away"),
    ],
    quota: {
      dailyLimit: awayStatsResult.quota.dailyLimit ?? homeStatsResult.quota.dailyLimit ?? lineupResult.quota.dailyLimit,
      dailyRemaining: awayStatsResult.quota.dailyRemaining ?? homeStatsResult.quota.dailyRemaining ?? lineupResult.quota.dailyRemaining,
    },
  };
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
