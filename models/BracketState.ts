// models/BracketState.ts
import mongoose, { Schema, Document } from "mongoose";
import type { KnockoutBracket, BracketRound, BracketMatch } from "@/types/tournamentDraw";

/**
 * BracketState Model
 *
 * Replaces the Schema.Types.Mixed bracket field in Tournament model.
 * Benefits:
 * - Automatic change tracking (no manual markModified() calls)
 * - Can query brackets independently
 * - Proper indexing and optimization
 * - Type-safe with Mongoose validation
 */

export interface IBracketState extends Document, KnockoutBracket {
  tournament: mongoose.Types.ObjectId;

  // Virtual properties
  pendingMatches: BracketMatch[];
  bracketWinner: string | null;

  // Methods
  findMatch(roundNumber: number, matchNumber: number): BracketMatch | null;
  updateMatch(roundNumber: number, matchNumber: number, updates: Partial<BracketMatch>): boolean;
  getMatchesNeedingDocuments(): BracketMatch[];
}

const bracketMatchSchema = new Schema<BracketMatch>({
  matchId: { type: String },
  participant1: { type: String, default: null },
  participant2: { type: String, default: null },
  winner: { type: String, default: null },
  completed: { type: Boolean, default: false },

  bracketPosition: {
    round: { type: Number, required: true },
    matchNumber: { type: Number, required: true },
    nextMatchNumber: { type: Number }
  },

  sourceMatches: {
    match1: { type: String },
    match2: { type: String }
  },

  scheduledDate: { type: Date },
  courtNumber: { type: Number },
  roundName: { type: String },
  isThirdPlaceMatch: { type: Boolean, default: false }
}, { _id: false });

const bracketRoundSchema = new Schema<BracketRound>({
  roundNumber: { type: Number, required: true },
  roundName: { type: String, required: true },
  matches: [bracketMatchSchema],
  completed: { type: Boolean, default: false },
  scheduledDate: { type: Date }
}, { _id: false });

const bracketStateSchema = new Schema<IBracketState>({
  tournament: {
    type: Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    unique: true // unique constraint automatically creates an index
  },
  size: { type: Number, required: true },
  rounds: [bracketRoundSchema],
  currentRound: { type: Number, default: 1 },
  completed: { type: Boolean, default: false },
  thirdPlaceMatch: bracketMatchSchema
}, {
  timestamps: true,
  collection: 'bracketstates'
});

// Indexes for efficient querying
// Note: tournament field already has unique index from schema definition
bracketStateSchema.index({ completed: 1 });

// Virtual to get pending matches
bracketStateSchema.virtual('pendingMatches').get(function(this: IBracketState) {
  const pending: BracketMatch[] = [];

  for (const round of this.rounds) {
    for (const match of round.matches) {
      if (!match.completed && match.participant1 && match.participant2) {
        pending.push(match);
      }
    }
  }

  return pending;
});

// Virtual to get bracket winner
bracketStateSchema.virtual('bracketWinner').get(function(this: IBracketState) {
  if (!this.completed || this.rounds.length === 0) {
    return null;
  }

  const finalRound = this.rounds[this.rounds.length - 1];
  if (finalRound.matches.length === 0) {
    return null;
  }

  const finalMatch = finalRound.matches[0];
  return finalMatch.winner || null;
});

// Method to find a match by position
bracketStateSchema.methods.findMatch = function(
  this: IBracketState,
  roundNumber: number,
  matchNumber: number
): BracketMatch | null {
  const round = this.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) return null;

  return round.matches.find(m => m.bracketPosition.matchNumber === matchNumber) || null;
};

// Method to update match and mark as modified
bracketStateSchema.methods.updateMatch = function(
  this: IBracketState,
  roundNumber: number,
  matchNumber: number,
  updates: Partial<BracketMatch>
): boolean {
  const round = this.rounds.find(r => r.roundNumber === roundNumber);
  if (!round) return false;

  const matchIndex = round.matches.findIndex(
    m => m.bracketPosition.matchNumber === matchNumber
  );
  if (matchIndex === -1) return false;

  // Update match
  round.matches[matchIndex] = {
    ...round.matches[matchIndex],
    ...updates
  };

  // Check if round is completed
  round.completed = round.matches.every(m => m.completed);

  // Check if entire bracket is completed
  if (this.currentRound === this.rounds.length) {
    const finalMatch = round.matches[0];
    if (finalMatch && finalMatch.completed) {
      this.completed = true;
    }
  }

  // Mongoose will auto-track changes (no markModified needed!)
  return true;
};

// Method to get all matches needing match documents
bracketStateSchema.methods.getMatchesNeedingDocuments = function(
  this: IBracketState
): BracketMatch[] {
  const needingDocs: BracketMatch[] = [];

  for (const round of this.rounds) {
    for (const match of round.matches) {
      // Match needs a document if both participants are known but no matchId assigned
      if (match.participant1 && match.participant2 && !match.matchId) {
        needingDocs.push(match);
      }
    }
  }

  // Check third place match
  if (this.thirdPlaceMatch &&
      this.thirdPlaceMatch.participant1 &&
      this.thirdPlaceMatch.participant2 &&
      !this.thirdPlaceMatch.matchId) {
    needingDocs.push(this.thirdPlaceMatch);
  }

  return needingDocs;
};

// Prevent OverwriteModelError in Next.js development hot reload
const BracketState =
  (mongoose.models.BracketState as mongoose.Model<IBracketState>) ||
  mongoose.model<IBracketState>('BracketState', bracketStateSchema);

export default BracketState;
