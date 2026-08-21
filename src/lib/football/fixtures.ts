export type FixtureTeam = {
  id: number;
  name: string;
  logo: string;
  winner: boolean | null;
};

export type Fixture = {
  fixture: {
    id: number;
    date: string;
    timestamp: number;
    timezone: string;
    venue: { id: number | null; name: string | null; city: string | null };
    status: { long: string; short: string; elapsed: number | null };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: FixtureTeam;
    away: FixtureTeam;
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

export type FixturesResponse = {
  date: string;
  fixtures: Fixture[];
  quota: {
    dailyLimit: number | null;
    dailyRemaining: number | null;
    minuteLimit: number | null;
    minuteRemaining: number | null;
  };
};
