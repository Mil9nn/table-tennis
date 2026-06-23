import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "@/models/User";
import { VerificationToken } from "@/models/VerificationToken";
import { Subscription } from "@/models/Subscription";
import PlayerStats from "@/models/PlayerStats";
import Team from "@/models/Team";
import TournamentIndividual from "@/models/TournamentIndividual";
import TournamentTeam from "@/models/TournamentTeam";
import { userUsesGoogleOnly } from "@/lib/auth/google-user";
import { cancelRazorpaySubscription } from "@/lib/razorpay";
import { connectDB } from "@/lib/mongodb";

export class DeleteAccountError extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "DeleteAccountError";
  }
}

async function cancelUserSubscription(userId: string): Promise<void> {
  const subscription = await Subscription.findOne({ user: userId });
  if (!subscription) return;

  if (
    subscription.razorpaySubscriptionId &&
    subscription.status === "active"
  ) {
    try {
      await cancelRazorpaySubscription(
        subscription.razorpaySubscriptionId,
        false
      );
    } catch (error) {
      console.error(
        "[delete-account] Razorpay cancellation failed:",
        error
      );
    }
  }

  await Subscription.deleteOne({ _id: subscription._id });
}

async function removeUserFromTeams(userId: mongoose.Types.ObjectId): Promise<void> {
  const userIdStr = userId.toString();

  const captainedTeams = await Team.find({ captain: userId });
  for (const team of captainedTeams) {
    const otherPlayers = team.players.filter(
      (p: { user: mongoose.Types.ObjectId }) =>
        p.user?.toString() !== userIdStr
    );

    if (otherPlayers.length > 0) {
      const newCaptainId = otherPlayers[0].user;
      team.captain = newCaptainId;
      team.players = otherPlayers.map(
        (p: { user: mongoose.Types.ObjectId; joinedDate?: Date }) => ({
          user: p.user,
          role:
            p.user?.toString() === newCaptainId?.toString()
              ? "captain"
              : "player",
          joinedDate: p.joinedDate,
        })
      );
      await team.save();
    } else {
      await Team.deleteOne({ _id: team._id });
    }
  }

  await Team.updateMany(
    { "players.user": userId },
    { $pull: { players: { user: userId } } }
  );
}

async function removeUserFromTournaments(
  userId: mongoose.Types.ObjectId
): Promise<void> {
  await TournamentIndividual.updateMany(
    {
      $or: [
        { participants: userId },
        { scorers: userId },
        { qualifiedParticipants: userId },
      ],
    },
    {
      $pull: {
        participants: userId,
        scorers: userId,
        qualifiedParticipants: userId,
      },
    }
  );

  await TournamentTeam.updateMany(
    { scorers: userId },
    { $pull: { scorers: userId } }
  );
}

export async function deleteUserAccount(
  userId: string,
  options: { password?: string }
): Promise<void> {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw new DeleteAccountError("User not found", 404);
  }

  if (!userUsesGoogleOnly(user)) {
    if (!options.password) {
      throw new DeleteAccountError(
        "Password is required to delete your account",
        400
      );
    }

    if (!user.password) {
      throw new DeleteAccountError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(
      options.password,
      user.password
    );
    if (!isPasswordValid) {
      throw new DeleteAccountError("Incorrect password", 401);
    }
  }

  const objectId = user._id;

  await VerificationToken.deleteMany({ userId: objectId });
  await cancelUserSubscription(userId);
  await PlayerStats.deleteMany({ user: objectId });
  await removeUserFromTeams(objectId);
  await removeUserFromTournaments(objectId);
  await User.deleteOne({ _id: objectId });
}
