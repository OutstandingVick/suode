export type PredictionTeam = {
  id: number;
  name: string;
  logo: string;
  last_5?: {
    form: string | null;
    att: string | null;
    def: string | null;
    goals: {
      for: { total: number; average: string };
      against: { total: number; average: string };
    };
  };
};

export type Prediction = {
  predictions: {
    winner: { id: number | null; name: string | null; comment: string | null };
    win_or_draw: boolean;
    under_over: string | null;
    goals: { home: string | null; away: string | null };
    advice: string;
    percent: { home: string; draw: string; away: string };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
  };
  teams: {
    home: PredictionTeam;
    away: PredictionTeam;
  };
  comparison: Record<string, { home: string; away: string }>;
  h2h: Array<{
    fixture: { id: number; date: string; status: { short: string } };
    teams: { home: { name: string }; away: { name: string } };
    goals: { home: number | null; away: number | null };
  }>;
};

export type PredictionResponse = {
  fixtureId: number;
  prediction: Prediction;
  evidence: {
    homeForm: TeamFormEvidence;
    awayForm: TeamFormEvidence;
    headToHead: HeadToHeadEvidence[];
  };
  quota: {
    dailyLimit: number | null;
    dailyRemaining: number | null;
    minuteLimit: number | null;
    minuteRemaining: number | null;
  };
};

export type TeamFormEvidence = {
  team: string;
  form: string | null;
  attack: string | null;
  defence: string | null;
  goalsForAverage: string | null;
  goalsAgainstAverage: string | null;
};

export type HeadToHeadEvidence = {
  fixtureId: number;
  date: string;
  home: string;
  away: string;
  homeGoals: number | null;
  awayGoals: number | null;
};
