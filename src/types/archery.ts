// Types
export interface Event {
  id: number;
  name: string;
  level: string;
  sublevel: string;
  location: string;
  start_date: string;
  end_date: string;
}

export interface Athlete {
  Id: string;
  FName: string;
  GName: string;
  WNameOrd: boolean;
  NOC: string;
}

export interface Competitor {
  MatchNo: number;
  QualRank: number;
  Arr: string;
  ArrTB: string;
  Score: number;
  SP: string;
  TB: string;
  Bye: boolean;
  Irm: string;
  WinLose: boolean;
  Name?: string;
  Athlete?: Athlete;
  Members?: Athlete[];
  NOC?: string;
}

export interface MatchData {
  Phase: number;
  Cat: string;
  MatchMode: number;
  TimeStamp: number;
  NumEnds: number;
  NumArrowsEnd: number;
  NumArrowsTB: number;
  IsLive: boolean;
  Competitor1: Competitor;
  Competitor2: Competitor;
  CategoryCode: string;
  athlete_ids?: string[];
  competition_id: string;
  competition_name?: string;
}