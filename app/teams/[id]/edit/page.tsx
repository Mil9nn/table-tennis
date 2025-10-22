// app/teams/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import UserSearchInput from "@/app/match/componets/UserSearchInput";
import Image from "next/image";
import { ArrowLeftCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/hooks/useAuthStore";

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  city: z.string().optional(),
  players: z.array(z.string()).min(2, "At least 2 players required"),
});

type User = {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
};

type Team = {
  _id: string;
  name: string;
  city?: string;
  captain: User;
  players: Array<{ user: User }>;
};

export default function EditTeamPage() {
  const router = useRouter();
  const params = useParams();
  const teamId = params.id as string;

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const user = useAuthStore((state) => state.user);

  const form = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      city: "",
      players: [] as string[],
    },
  });

  useEffect(() => {
    fetchTeam();
  }, [teamId]);

  const fetchTeam = async () => {
    try {
      const res = await axiosInstance.get(`/teams/${teamId}`);
      const fetchedTeam = res.data.team;
      setTeam(fetchedTeam);

      // Check if user is captain
      if (user && fetchedTeam.captain._id !== user._id) {
        toast.error("Only the team captain can edit this team");
        router.push("/teams");
        return;
      }

      // Set form values
      form.setValue("name", fetchedTeam.name);
      form.setValue("city", fetchedTeam.city || "");

      // Set players
      const teamPlayers = fetchedTeam.players.map((p: any) => p.user);
      setPlayers(teamPlayers);
      form.setValue(
        "players",
        teamPlayers.map((p: User) => p._id)
      );
    } catch (err: any) {
      console.error("Error fetching team:", err);
      toast.error("Failed to load team");
      router.push("/teams");
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = (user: User) => {
    const exists = players.some((p) => p._id === user._id);
    if (!exists) {
      const updated = [...players, user];
      setPlayers(updated);
      form.setValue(
        "players",
        updated.map((p) => p._id)
      );
    }
  };

  const removePlayer = (id: string) => {
    // Don't allow removing the captain
    if (team && id === team.captain._id) {
      toast.error("Cannot remove the team captain");
      return;
    }

    const updated = players.filter((p) => p._id !== id);
    setPlayers(updated);
    form.setValue(
      "players",
      updated.map((p) => p._id)
    );
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const payload = {
        name: data.name,
        city: data.city,
        players: players.map((p) => p._id),
      };

      await axiosInstance.put(`/teams/${teamId}`, payload);
      toast.success("Team updated successfully!");
      router.push("/teams");
    } catch (err: any) {
      console.error("Error updating team:", err);
      toast.error(err.response?.data?.message || "Failed to update team");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/teams"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-full shadow-sm hover:shadow-md text-blue-700 transition"
        >
          <ArrowLeftCircle className="w-4 h-4" />
          <span className="font-semibold">Back to Teams</span>
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Edit Team</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Team Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter team name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City / Club</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city/club" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Captain (read-only) */}
          <div>
            <FormLabel>Team Captain</FormLabel>
            <div className="mt-2 flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              {team.captain.profileImage ? (
                <Image
                  src={team.captain.profileImage}
                  alt={team.captain.fullName || team.captain.username}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                  {(
                    team.captain.fullName?.[0] ||
                    team.captain.username?.[0] ||
                    "?"
                  ).toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-medium text-sm">
                  {team.captain.fullName || team.captain.username}
                </p>
                <p className="text-xs text-gray-500">Captain (cannot be changed)</p>
              </div>
            </div>
          </div>

          {/* Players */}
          <FormField
            control={form.control}
            name="players"
            render={() => (
              <FormItem>
                <FormLabel>Players</FormLabel>
                <UserSearchInput
                  placeholder="Search player by username"
                  clearAfterSelect
                  onSelect={(u) => addPlayer(u)}
                />

                {/* Player List */}
                <div className="mt-3 space-y-2">
                  {players.length > 0 ? (
                    players.map((p) => {
                      const isCaptain = p._id === team.captain._id;
                      return (
                        <div
                          key={p._id}
                          className="flex justify-between items-center border p-2 rounded"
                        >
                          <div className="flex items-center gap-3">
                            {p.profileImage ? (
                              <Image
                                src={p.profileImage}
                                alt={p.fullName || p.username}
                                width={36}
                                height={36}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700">
                                {(
                                  p.fullName?.[0] ||
                                  p.username?.[0] ||
                                  "?"
                                ).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-sm">
                                {p.fullName || p.username}
                              </span>
                              {isCaptain && (
                                <span className="ml-2 text-xs text-blue-600 font-semibold">
                                  (Captain)
                                </span>
                              )}
                            </div>
                          </div>
                          {!isCaptain && (
                            <button
                              type="button"
                              className="text-red-500 text-xs font-medium hover:underline"
                              onClick={() => removePlayer(p._id)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500">No players added yet.</p>
                  )}
                </div>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/teams")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}