export interface SchedulePairing {
  player1: string; // ObjectId string
  player2: string;
}

export interface ScheduleRound {
  roundNumber: number;
  scheduledDate: Date;
  matches: SchedulePairing[];
}

export type RoundRobinSchedule = ScheduleRound[];

export interface GroupAllocation {
  groupId: string;
  groupName: string;
  participants: string[];
}

export interface BracketMatch {
  matchId?: string; // Assigned after creating IndividualMatch
  participant1: string | null;  // participant ID or slot
  participant2: string | null;
  completed: boolean;
}

export interface BracketRound {
  roundNumber: number;
  matches: BracketMatch[];
}

export interface KnockoutBracket {
  size: number;
  rounds: BracketRound[];
}
