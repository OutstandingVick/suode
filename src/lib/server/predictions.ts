import "server-only";

import type {
  Prediction,
  PredictionResponse,
  PredictionTeam,
  TeamFormEvidence,
} from "@/lib/football/predictions";
import { apiFootballGet } from "@/lib/server/api-football";

export async function getPrediction(fixtureId: number): Promise<PredictionResponse> {
  const result = await apiFootballGet<Prediction[]>("predictions", { fixture: fixtureId });
  const prediction = result.data[0];

  if (!prediction) {
    throw new Error("API-Football has no prediction available for this fixture.");
  }

  return {
    fixtureId,
    prediction,
    evidence: {
      homeForm: teamForm(prediction.teams.home),
      awayForm: teamForm(prediction.teams.away),
      headToHead: prediction.h2h.slice(0, 5).map((match) => ({
        fixtureId: match.fixture.id,
        date: match.fixture.date,
        home: match.teams.home.name,
        away: match.teams.away.name,
        homeGoals: match.goals.home,
        awayGoals: match.goals.away,
      })),
    },
    quota: result.quota,
  };
}

function teamForm(team: PredictionTeam): TeamFormEvidence {
  return {
    team: team.name,
    form: team.last_5?.form ?? null,
    attack: team.last_5?.att ?? null,
    defence: team.last_5?.def ?? null,
    goalsForAverage: team.last_5?.goals.for.average ?? null,
    goalsAgainstAverage: team.last_5?.goals.against.average ?? null,
  };
}
