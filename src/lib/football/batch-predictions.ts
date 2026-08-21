export type BatchPredictionItem = {
  fixtureId: number;
  kickoff: string;
  league: string;
  home: string;
  away: string;
  winner: string;
  advice: string;
  expectedGoals: { home: string | null; away: string | null };
  percentages: { home: string; draw: string; away: string };
  strength: number;
};

export type BatchPredictionResponse = {
  query: string;
  requested: number;
  attempted: number;
  unavailable: number;
  predictions: BatchPredictionItem[];
  cached: boolean;
  quota: { dailyLimit: number | null; dailyRemaining: number | null };
  warning: string | null;
};
