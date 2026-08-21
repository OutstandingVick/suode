export type StandingEvidence = {
  teamId: number;
  team: string;
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsDiff: number;
  form: string | null;
};

export type DeepResearchResponse = {
  fixtureId: number;
  standings: StandingEvidence[];
  quota: {
    dailyLimit: number | null;
    dailyRemaining: number | null;
  };
};
