export interface Player {
  id: string;
  nameDisplay: string;
  nameShort: string;
  countryCode: string;
  countryName: string;
  countryFlagUrl: string;
  avatar: {
    title: string;
    thumbnailUrl: string;
  };
}

export interface Team {
  countryCode: string;
  countryFlagUrl: string;
  players: Player[];
}

export interface Score {
  set: number;
  home: number;
  away: number;
  lastPointWinner: number | null;
  serve: number | null;
}

export interface Match {
  id: number;
  code: string;
  tournamentCode: string;
  tournamentName: string;
  matchTime: string;
  matchTimeUtc: string;
  roundName: string;
  matchTypeValue: string;
  team1: Team;
  team2: Team;
  team1seed?: string;
  team2seed?: string;
  score: Score[];
  courtName: string;
  duration: number;
  matchStatus: string;
  matchStatusValue: string;
  eventName: string;
  winner: 1 | 2;
}

export interface TournamentResults {
  [round: string]: Match[];
}

export interface Tournament {
  id: number;
  code: string;
  name: string;
  category: string;
  prize_money: string;
  start_date: string;
  end_date: string;
  location: string;
  logo: string;
  is_etihad: boolean;
}
