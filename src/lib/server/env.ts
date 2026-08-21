const API_FOOTBALL_KEY_NAME = "API_FOOTBALL_KEY" as const;

export function hasApiFootballKey(): boolean {
  return Boolean(process.env.API_FOOTBALL_KEY?.trim());
}

export function getApiFootballKey(): string {
  const key = process.env.API_FOOTBALL_KEY?.trim();

  if (!key) {
    throw new Error(
      `${API_FOOTBALL_KEY_NAME} is not configured. Add it to the project-root .env.local file.`,
    );
  }

  return key;
}
