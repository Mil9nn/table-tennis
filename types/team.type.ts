// types/team.type.ts

export type SideKey = "sideA" | "sideB";

export type TeamMatchFormat =
  | "swaythling-5"
  | "swaythling-9"
  | "sds"
  | "three-singles"
  | { customOrder: TeamTie[] };

export interface TeamPlayer {
  id: string;
  fullName?: string;
  username?: string;
  role?: "A" | "B" | "C" | "X" | "Y" | "Z";
}

export interface TeamTie {
  a: string; // player letter A/B/C
  b: string; // opponent letter X/Y/Z
  type?: "singles" | "doubles";
}

export interface TeamMatch {
  _id: string;
  format: TeamMatchFormat;
  status?: "scheduled" | "in_progress" | "completed";
  participants: TeamPlayer[];
  games: any[]; // keep consistent with your existing GamesHistory / ShotFeed
}
