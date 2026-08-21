import "server-only";

import type { BatchPredictionItem, BatchPredictionResponse } from "@/lib/football/batch-predictions";
import type { Fixture } from "@/lib/football/fixtures";
import { dateInAppTimezone, getFixturesForDate } from "@/lib/server/fixtures";
import { getPrediction } from "@/lib/server/predictions";

const MAX_PREDICTIONS = 5;
const MAX_ATTEMPTS = 10;
const BATCH_CACHE_MS = 5 * 60 * 1000;
const completedStatuses = new Set(["FT", "AET", "PEN", "CANC", "PST", "ABD", "AWD", "WO"]);

type CachedBatch = { expiresAt: number; response: BatchPredictionResponse };
const batchCache = new Map<string, CachedBatch>();

function requestedCount(query: string): number {
  const match = query.match(/\b(\d{1,2})\b/);
  return Math.min(Math.max(match ? Number(match[1]) : MAX_PREDICTIONS, 1), MAX_PREDICTIONS);
}

function percentage(value: string): number {
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function candidateScore(fixture: Fixture): number {
  const status = fixture.fixture.status.short;
  if (["1H", "HT", "2H", "ET", "LIVE"].includes(status)) return 3;
  if (["NS", "TBD"].includes(status)) return 2;
  return 1;
}

export async function getBatchPredictions(query: string): Promise<BatchPredictionResponse> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const count = requestedCount(normalizedQuery);
  const date = dateInAppTimezone();
  const cacheKey = `${date}:${count}:${normalizedQuery.toLowerCase()}`;
  const cached = batchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return { ...cached.response, cached: true };

  const fixtureResult = await getFixturesForDate(date);
  const candidates = fixtureResult.fixtures
    .filter((fixture) => !completedStatuses.has(fixture.fixture.status.short))
    .sort((a, b) => candidateScore(b) - candidateScore(a) || a.fixture.timestamp - b.fixture.timestamp)
    .slice(0, Math.min(MAX_ATTEMPTS, Math.max(count * 2, count)));

  const predictions: BatchPredictionItem[] = [];
  let attempted = 0;
  let unavailable = 0;
  let dailyRemaining = fixtureResult.quota.dailyRemaining;
  let dailyLimit = fixtureResult.quota.dailyLimit;

  for (const fixture of candidates) {
    if (predictions.length >= count) break;
    attempted += 1;
    try {
      const result = await getPrediction(fixture.fixture.id);
      dailyRemaining = result.quota.dailyRemaining ?? dailyRemaining;
      dailyLimit = result.quota.dailyLimit ?? dailyLimit;
      const values = result.prediction.predictions.percent;
      predictions.push({
        fixtureId: fixture.fixture.id,
        kickoff: fixture.fixture.date,
        league: fixture.league.name,
        home: fixture.teams.home.name,
        away: fixture.teams.away.name,
        winner: result.prediction.predictions.winner.name ?? "No clear winner",
        advice: result.prediction.predictions.advice,
        expectedGoals: result.prediction.predictions.goals,
        percentages: values,
        strength: Math.max(percentage(values.home), percentage(values.draw), percentage(values.away)),
      });
    } catch {
      unavailable += 1;
    }
  }

  predictions.sort((a, b) => b.strength - a.strength);
  const response: BatchPredictionResponse = {
    query: normalizedQuery,
    requested: count,
    attempted,
    unavailable,
    predictions,
    cached: false,
    quota: { dailyLimit, dailyRemaining },
    warning: predictions.length < count
      ? `Only ${predictions.length} of ${count} requested predictions were available within the ${MAX_ATTEMPTS}-fixture safety limit.`
      : null,
  };
  batchCache.set(cacheKey, { expiresAt: Date.now() + BATCH_CACHE_MS, response });
  return response;
}
