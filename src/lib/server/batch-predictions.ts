import "server-only";

import type { BatchPredictionItem, BatchPredictionResponse } from "@/lib/football/batch-predictions";
import type { Fixture } from "@/lib/football/fixtures";
import { dateInAppTimezone, getFixturesForDate } from "@/lib/server/fixtures";
import { getPrediction } from "@/lib/server/predictions";

const DEFAULT_PREDICTIONS = 5;
const MAX_PREDICTIONS = 10;
const MAX_ATTEMPTS = 10;
const BATCH_CACHE_MS = 5 * 60 * 1000;
const KICKOFF_BUFFER_MS = 60 * 60 * 1000;
const upcomingStatuses = new Set(["NS", "TBD"]);

type CachedBatch = { expiresAt: number; response: BatchPredictionResponse };
const batchCache = new Map<string, CachedBatch>();

function requestedCount(query: string): { count: number; capped: boolean } {
  const match = query.match(/\b(\d{1,2})\b/);
  const requested = match ? Number(match[1]) : DEFAULT_PREDICTIONS;
  return {
    count: Math.min(Math.max(requested, 1), MAX_PREDICTIONS),
    capped: requested > MAX_PREDICTIONS,
  };
}

function percentage(value: string): number {
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function candidateScore(fixture: Fixture): number {
  return fixture.fixture.status.short === "NS" ? 2 : 1;
}

export function isUpcomingFixture(fixture: Fixture, now = Date.now()): boolean {
  return upcomingStatuses.has(fixture.fixture.status.short)
    && fixture.fixture.timestamp * 1000 > now + KICKOFF_BUFFER_MS;
}

export async function getBatchPredictions(query: string): Promise<BatchPredictionResponse> {
  const normalizedQuery = query.trim().replace(/\s+/g, " ");
  const { count, capped } = requestedCount(normalizedQuery);
  const date = dateInAppTimezone();
  const cacheKey = `${date}:${count}:${normalizedQuery.toLowerCase()}`;
  const cached = batchCache.get(cacheKey);
  const now = Date.now();
  if (
    cached
    && cached.expiresAt > now
    && cached.response.predictions.every(
      (item) => new Date(item.kickoff).getTime() > now + KICKOFF_BUFFER_MS,
    )
  ) {
    return { ...cached.response, cached: true };
  }
  if (cached) batchCache.delete(cacheKey);

  const fixtureResult = await getFixturesForDate(date);
  const candidates = fixtureResult.fixtures
    // Some competitions have no live coverage and remain `NS` after kickoff.
    // Timestamp validation and the one-hour buffer keep stale or imminent
    // fixtures out of prediction batches.
    .filter((fixture) => isUpcomingFixture(fixture))
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
  const generatedAt = Date.now();
  const nextEligibilityCutoff = predictions.length
    ? Math.min(...predictions.map(
      (item) => new Date(item.kickoff).getTime() - KICKOFF_BUFFER_MS,
    ))
    : Number.POSITIVE_INFINITY;
  const expiresAt = Math.min(generatedAt + BATCH_CACHE_MS, nextEligibilityCutoff);
  const response: BatchPredictionResponse = {
    query: normalizedQuery,
    requested: count,
    attempted,
    unavailable,
    predictions,
    cached: false,
    generatedAt: new Date(generatedAt).toISOString(),
    freshUntil: new Date(expiresAt).toISOString(),
    quota: { dailyLimit, dailyRemaining },
    warning: capped
      ? `Suode limits one batch to ${MAX_PREDICTIONS} matches to protect the free API quota.`
      : predictions.length < count
        ? `Only ${predictions.length} of ${count} requested predictions were available within the ${MAX_ATTEMPTS}-fixture safety limit.`
        : null,
  };
  batchCache.set(cacheKey, { expiresAt, response });
  return response;
}
