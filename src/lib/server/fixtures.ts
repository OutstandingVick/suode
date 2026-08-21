import "server-only";

import { apiFootballGet } from "@/lib/server/api-football";
import type { Fixture, FixturesResponse } from "@/lib/football/fixtures";

const APP_TIMEZONE = "Africa/Lagos";

export function dateInAppTimezone(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function getFixturesForDate(date: string): Promise<FixturesResponse> {
  const result = await apiFootballGet<Fixture[]>("fixtures", {
    date,
    timezone: APP_TIMEZONE,
  });

  return {
    date,
    fixtures: result.data,
    quota: result.quota,
  };
}
