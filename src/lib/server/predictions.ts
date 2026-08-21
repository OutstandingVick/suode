import "server-only";

import type { Prediction, PredictionResponse } from "@/lib/football/predictions";
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
    quota: result.quota,
  };
}
