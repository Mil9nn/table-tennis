// types/tournament.type.ts
export interface Tournament {
  _id: string;
  name: string;
  format: "round_robin" | "knockout" | "swiss";
  category: "individual" | "team";
  matchType: "singles" | "doubles" | "mixed_doubles";
  startDate: Date;
  endDate?: Date;
  status: "draft" | "upcoming" | "in_progress" | "completed" | "cancelled";
  
  participants: Participant[];
  organizer: Participant;
  
  rounds: Round[];
  standings: Standing[];
  
  rules: {
    pointsForWin: number;
    pointsForLoss: number;
    pointsForDraw: number;
    setsPerMatch: number;
    advanceTop: number;
  };
  
  venue?: string;
  city: string;
  description?: string;
  prizePool?: string;
  registrationDeadline?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Round {
  roundNumber: number;
  matches: string[];
  completed: boolean;
}

export interface Standing {
  participant: Participant;
  played: number;
  won: number;
  lost: number;
  setsWon: number;
  setsLost: number;
  points: number;
  rank: number;
}

interface Participant {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
}