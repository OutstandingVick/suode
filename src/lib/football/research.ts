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
  injuries: InjuryEvidence[];
  lineups: LineupEvidence[];
  quota: {
    dailyLimit: number | null;
    dailyRemaining: number | null;
  };
};

export type LineupEvidence = {
  teamId: number;
  team: string;
  formation: string | null;
  coach: string | null;
  startingEleven: Array<{ playerId: number; name: string; position: string; number: number | null }>;
};

export type InjuryEvidence = {
  teamId: number;
  team: string;
  playerId: number;
  player: string;
  type: string;
  reason: string;
};
