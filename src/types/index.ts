export type TournamentStatus = 'setup' | 'groups' | 'knockout' | 'finished';

export interface Tournament {
  id: string;
  name: string;
  registration_deadline: string | null;
  status: TournamentStatus;
  created_at: string;
}

export interface Group {
  id: string;
  tournament_id: string;
  name: string;
  order_index: number;
}

export interface Player {
  id: string;
  tournament_id: string;
  group_id: string | null;
  name: string;
  country_code: string;
  country_name: string;
}

export type MatchPhase = 'group' | 'round_of_16' | 'quarter' | 'semi' | 'third_place' | 'final';

export interface Match {
  id: string;
  tournament_id: string;
  group_id: string | null;
  phase: MatchPhase;
  round_order: number;
  home_player_id: string | null;
  away_player_id: string | null;
  scheduled_at: string | null;
  status: 'scheduled' | 'finished';
  home_score: number | null;
  away_score: number | null;
  extra_time_home: number | null;
  extra_time_away: number | null;
  penalties_home: number | null;
  penalties_away: number | null;
  winner_player_id: string | null;
  edited_at: string | null;
  next_match_id: string | null;
  next_match_position: 'home' | 'away' | null;
  created_at: string;
}

export interface TeamStanding {
  player: Player;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export interface Country {
  code: string;
  alpha2: string;
  name: string;
}
