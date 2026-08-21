import "server-only";

import type { DeepResearchResponse, StandingEvidence } from "@/lib/football/research";
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

const RESEARCH_CACHE_SECONDS = 3600;

export async function getDeepResearch(fixtureId: number): Promise<DeepResearchResponse> {
  const predictionResult = await getPrediction(fixtureId);
  const { prediction } = predictionResult;
  const standingResult = await apiFootballGet<StandingLeague[]>(
    "standings",
    { league: prediction.league.id, season: prediction.league.season },
    { cacheSeconds: RESEARCH_CACHE_SECONDS },
  );
  const rows = standingResult.data.flatMap((entry) => entry.league.standings.flat());
  const teamIds = new Set([prediction.teams.home.id, prediction.teams.away.id]);

  return {
    fixtureId,
    standings: rows.filter((row) => teamIds.has(row.team.id)).map(toStandingEvidence),
    quota: {
      dailyLimit: standingResult.quota.dailyLimit,
      dailyRemaining: standingResult.quota.dailyRemaining,
    },
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
