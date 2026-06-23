import mongoose, { Schema, Document } from "mongoose";

export interface IStandingRow {
  participantId: mongoose.Types.ObjectId;
  played: number;
  won: number;
  lost: number;
  drawn: number;
  setsWon: number;
  setsLost: number;
  setsDiff: number;
  pointsScored: number;
  pointsConceded: number;
  pointsDiff: number;
  points: number;
  rank: number;
  form: string[];
  headToHead?: Map<string, number>;
}

export interface ITournamentStandings extends Document {
  tournament: mongoose.Types.ObjectId;
  category: "individual" | "team";
  phase?: "round_robin" | "knockout" | "transition";
  groupId?: string;
  rows: IStandingRow[];
  createdAt: Date;
  updatedAt: Date;
}

const standingsRowSchema = new Schema<IStandingRow>(
  {
    participantId: { type: Schema.Types.ObjectId, required: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    lost: { type: Number, default: 0 },
    drawn: { type: Number, default: 0 },
    setsWon: { type: Number, default: 0 },
    setsLost: { type: Number, default: 0 },
    setsDiff: { type: Number, default: 0 },
    pointsScored: { type: Number, default: 0 },
    pointsConceded: { type: Number, default: 0 },
    pointsDiff: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
    form: [{ type: String }],
    headToHead: { type: Map, of: Number },
  },
  { _id: false }
);

const tournamentStandingsSchema = new Schema<ITournamentStandings>(
  {
    tournament: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    category: {
      type: String,
      enum: ["individual", "team"],
      required: true,
    },
    phase: {
      type: String,
      enum: ["round_robin", "knockout", "transition"],
    },
    groupId: { type: String },
    rows: { type: [standingsRowSchema], default: [] },
  },
  {
    timestamps: true,
    collection: "tournament_standings",
  }
);

tournamentStandingsSchema.index({ tournament: 1, groupId: 1 }, { unique: true });
tournamentStandingsSchema.index({ tournament: 1 });
tournamentStandingsSchema.index({ category: 1, phase: 1 });

const TournamentStandings =
  (mongoose.models.TournamentStandings as mongoose.Model<ITournamentStandings>) ||
  mongoose.model<ITournamentStandings>("TournamentStandings", tournamentStandingsSchema);

export default TournamentStandings;
