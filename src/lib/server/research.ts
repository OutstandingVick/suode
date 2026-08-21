import "server-only";

import type { DeepResearchResponse, InjuryEvidence, LineupEvidence, StandingEvidence } from "@/lib/football/research";
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

const RESEARCH_CACHE_SECONDS = 3600;

export async function getDeepResearch(fixtureId: number): Promise<DeepResearchResponse> {
  const predictionResult = await getPrediction(fixtureId);
  const { prediction } = predictionResult;
  const [standingResult, injuryResult, lineupResult] = await Promise.all([
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
  ]);
  const rows = standingResult.data.flatMap((entry) => entry.league.standings.flat());
  const teamIds = new Set([prediction.teams.home.id, prediction.teams.away.id]);

  return {
    fixtureId,
    standings: rows.filter((row) => teamIds.has(row.team.id)).map(toStandingEvidence),
    injuries: injuryResult.data.map(toInjuryEvidence),
    lineups: lineupResult.data.map(toLineupEvidence),
    quota: {
      dailyLimit: lineupResult.quota.dailyLimit ?? injuryResult.quota.dailyLimit ?? standingResult.quota.dailyLimit,
      dailyRemaining: lineupResult.quota.dailyRemaining ?? injuryResult.quota.dailyRemaining ?? standingResult.quota.dailyRemaining,
    },
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
