// models/MatchBase.ts
import mongoose, { Schema, Document } from "mongoose";

/**
 * Match Base Schema
 *
 * Shared fields for all match types (Individual and Team)
 * Uses MongoDB discriminators for type-specific fields
 *
 * Benefits:
 * - Single collection for all matches
 * - Shared queries across match types
 * - No field duplication
 * - Proper type safety with discriminated unions
 */

export interface IMatchBase extends Document {
  // Category discriminator
  matchCategory: 'individual' | 'team';

  // Tournament context
  tournament?: mongoose.Types.ObjectId;
  groupId?: string; // For round-robin group matches

  // Knockout/Bracket metadata
  bracketPosition?: {
    round: number;
    matchNumber: number;
    nextMatchNumber?: number;
  };
  roundName?: string;
  courtNumber?: number;
  isThirdPlaceMatch?: boolean;

  // Match management
  scorer?: mongoose.Types.ObjectId;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  matchDuration?: number;

  // Location
  city?: string;
  venue?: string;

  // Shot tracking mode (optional, overrides user preference for this match)
  shotTrackingMode?: 'detailed' | 'simple';

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Base match schema - shared fields for all match types
 */
export const matchBaseSchema = new Schema<IMatchBase>(
  {
    // Match category (discriminator key)
    matchCategory: {
      type: String,
      enum: ['individual', 'team'],
      required: true
    },

    // Tournament context
    tournament: {
      type: Schema.Types.ObjectId,
      ref: 'Tournament', // Generic ref - actual model determined by context
      default: null
    },
    groupId: {
      type: String,
      default: null
    },

    // Knockout/Bracket metadata
    bracketPosition: {
      round: { type: Number },
      matchNumber: { type: Number },
      nextMatchNumber: { type: Number }
    },
    roundName: { type: String },
    courtNumber: { type: Number },
    isThirdPlaceMatch: { type: Boolean, default: false },

    // Match management
    scorer: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    matchDuration: { type: Number },

    // Location
    city: { type: String },
    venue: { type: String },

    // Shot tracking mode (optional, overrides user preference for this match)
    shotTrackingMode: {
      type: String,
      enum: ['detailed', 'simple'],
      default: null,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'matchCategory',
    collection: 'matches' // Single collection for all matches
  }
);

// Indexes for efficient queries
matchBaseSchema.index({ tournament: 1 });
matchBaseSchema.index({ status: 1 });
matchBaseSchema.index({ matchCategory: 1 });
matchBaseSchema.index({ groupId: 1 });
matchBaseSchema.index({ 'bracketPosition.round': 1 });
matchBaseSchema.index({ scorer: 1 });
matchBaseSchema.index({ createdAt: -1 });

// Compound indexes for common queries
matchBaseSchema.index({ tournament: 1, status: 1 });
matchBaseSchema.index({ tournament: 1, matchCategory: 1 });
matchBaseSchema.index({ tournament: 1, groupId: 1 });

// Virtual for match completion status
matchBaseSchema.virtual('isCompleted').get(function(this: IMatchBase) {
  return this.status === 'completed';
});

// Virtual for tournament match check
matchBaseSchema.virtual('isTournamentMatch').get(function(this: IMatchBase) {
  return !!this.tournament;
});

// Method to check if match is in a bracket
matchBaseSchema.methods.isKnockoutMatch = function(this: IMatchBase): boolean {
  return !!this.bracketPosition;
};

// Method to check if match is in a group
matchBaseSchema.methods.isGroupMatch = function(this: IMatchBase): boolean {
  return !!this.groupId;
};

// Prevent model overwrite during hot reload in Next.js
const Match = mongoose.models.Match || mongoose.model<IMatchBase>('Match', matchBaseSchema);

export default Match;
