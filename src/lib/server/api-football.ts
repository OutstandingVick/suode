import "server-only";

import { getApiFootballKey } from "@/lib/server/env";

const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";

export type ApiFootballPaging = {
  current: number;
  total: number;
};

export type ApiFootballQuota = {
  dailyLimit: number | null;
  dailyRemaining: number | null;
  minuteLimit: number | null;
  minuteRemaining: number | null;
};

export type ApiFootballResult<T> = {
  data: T;
  paging: ApiFootballPaging;
  quota: ApiFootballQuota;
};

type ApiFootballRequestOptions = {
  cacheSeconds?: number;
};

type ApiFootballEnvelope<T> = {
  errors: Record<string, string> | string[];
  paging: ApiFootballPaging;
  response: T;
};

export class ApiFootballError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiFootballError";
  }
}

function numberHeader(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function errorMessage(errors: ApiFootballEnvelope<unknown>["errors"]): string | null {
  if (Array.isArray(errors)) return errors.length ? errors.join(", ") : null;

  const messages = Object.values(errors);
  return messages.length ? messages.join(", ") : null;
}

export async function apiFootballGet<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  options: ApiFootballRequestOptions = {},
): Promise<ApiFootballResult<T>> {
  const url = new URL(`${API_FOOTBALL_BASE_URL}/${endpoint.replace(/^\/+/, "")}`);

  for (const [name, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(name, String(value));
  }

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": getApiFootballKey(),
    },
    ...(options.cacheSeconds
      ? { next: { revalidate: options.cacheSeconds } }
      : { cache: "no-store" as const }),
  });

  let payload: ApiFootballEnvelope<T>;
  try {
    payload = (await response.json()) as ApiFootballEnvelope<T>;
  } catch {
    throw new ApiFootballError("API-Football returned an unreadable response.", response.status);
  }

  const upstreamError = errorMessage(payload.errors);
  if (!response.ok || upstreamError) {
    throw new ApiFootballError(
      upstreamError ?? `API-Football request failed with status ${response.status}.`,
      response.status,
    );
  }

  return {
    data: payload.response,
    paging: payload.paging,
    quota: {
      dailyLimit: numberHeader(response.headers, "x-ratelimit-requests-limit"),
      dailyRemaining: numberHeader(response.headers, "x-ratelimit-requests-remaining"),
      minuteLimit: numberHeader(response.headers, "x-ratelimit-limit"),
      minuteRemaining: numberHeader(response.headers, "x-ratelimit-remaining"),
    },
  };
}
