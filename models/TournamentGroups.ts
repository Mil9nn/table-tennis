import mongoose, { Schema, Document } from "mongoose";

export interface IGroupRound {
  roundNumber: number;
  matches: mongoose.Types.ObjectId[];
  completed: boolean;
  scheduledDate?: Date;
  scheduledTime?: string;
}

export interface IGroupEntry {
  groupId: string;
  groupName: string;
  participantIds: mongoose.Types.ObjectId[];
  rounds: IGroupRound[];
}

export interface ITournamentGroups extends Document {
  tournament: mongoose.Types.ObjectId;
  category: "individual" | "team";
  groups: IGroupEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const groupRoundSchema = new Schema<IGroupRound>(
  {
    roundNumber: { type: Number, required: true },
    matches: [{ type: Schema.Types.ObjectId, ref: "Match" }],
    completed: { type: Boolean, default: false },
    scheduledDate: { type: Date },
    scheduledTime: { type: String },
  },
  { _id: false }
);

const groupEntrySchema = new Schema<IGroupEntry>(
  {
    groupId: { type: String, required: true },
    groupName: { type: String, required: true },
    participantIds: [{ type: Schema.Types.ObjectId, required: true }],
    rounds: { type: [groupRoundSchema], default: [] },
  },
  { _id: false }
);

const tournamentGroupsSchema = new Schema<ITournamentGroups>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true,
    },
    category: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },
    groups: { type: [groupEntrySchema], default: [] },
  },
  {
    timestamps: true,
    collection: "tournament_groups",
  }
);

tournamentGroupsSchema.index({ category: 1 });
tournamentGroupsSchema.index({ "groups.groupId": 1 });

const TournamentGroups =
  (mongoose.models.TournamentGroups as mongoose.Model<ITournamentGroups>) ||
  mongoose.model<ITournamentGroups>("TournamentGroups", tournamentGroupsSchema);

export default TournamentGroups;
