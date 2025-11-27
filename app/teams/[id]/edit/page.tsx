// app/teams/[id]/edit/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
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
import { ChevronLeft, Loader2, Upload, X, Camera } from "lucide-react";
import { useDropzone } from "react-dropzone";
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
  logo?: string;
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
  const [teamImage, setTeamImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

      // Set existing logo preview
      if (fetchedTeam.logo) {
        setImagePreview(fetchedTeam.logo);
      }

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setTeamImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
    maxSize: 5242880,
  });

  const removeImage = () => {
    setTeamImage(null);
    setImagePreview(null);
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
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("city", data.city || "");
      formData.append("players", JSON.stringify(players.map((p) => p._id)));

      if (teamImage) {
        formData.append("teamImage", teamImage);
      }

      await axiosInstance.put(`/teams/${teamId}`, formData);
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
      <div className="flex items-center justify-center min-h-screen bg-[#6C6FD5]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!team) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#6C6FD5] p-6">
      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 bg-white/20 transition"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>

        <div className="flex flex-col items-center mx-auto gap-1">
          <h1 className="sm:text-4xl text-2xl font-semibold text-white tracking-tight">
            Edit Team
          </h1>
          <p className="text-white/70 text-sm">
            Update your team details and roster
          </p>
        </div>

        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Team Logo */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700">
                Team Logo
              </FormLabel>

              <div className="mt-3 flex items-center gap-6">
                {/* Current/Preview Image */}
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <Image
                        src={imagePreview}
                        alt="Team logo"
                        width={100}
                        height={100}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Camera className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Upload Area */}
                <div
                  {...getRootProps()}
                  className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-4 cursor-pointer transition ${
                    isDragActive
                      ? "border-[#667eea] bg-[#667eea]/5"
                      : "border-gray-300 hover:border-gray-400 bg-gray-50"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-6 h-6 text-[#667eea] mb-2" />
                  <p className="text-gray-600 text-sm text-center">
                    {isDragActive ? "Drop here" : "Click or drag to upload"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Team Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Team Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter team name"
                      {...field}
                      className="bg-gray-50 border-gray-200 focus:border-[#667eea] focus:ring-[#667eea]"
                    />
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
                  <FormLabel className="text-sm font-medium text-gray-700">
                    City / Club
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter city or club name"
                      {...field}
                      className="bg-gray-50 border-gray-200 focus:border-[#667eea] focus:ring-[#667eea]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Captain (read-only) */}
            <div>
              <FormLabel className="text-sm font-medium text-gray-700">
                Team Captain
              </FormLabel>
              <div className="mt-2 flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                {team.captain.profileImage ? (
                  <Image
                    src={team.captain.profileImage}
                    alt={team.captain.fullName || team.captain.username}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-yellow-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#5a6fd6] flex items-center justify-center font-semibold text-white ring-2 ring-yellow-400">
                    {(
                      team.captain.fullName?.[0] ||
                      team.captain.username?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-800">
                    {team.captain.fullName || team.captain.username}
                  </p>
                  <p className="text-xs text-gray-500">@{team.captain.username}</p>
                </div>
                <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                  CAPTAIN
                </span>
              </div>
            </div>

            {/* Players */}
            <FormField
              control={form.control}
              name="players"
              render={() => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Squad Members
                  </FormLabel>
                  <UserSearchInput
                    placeholder="Search player by username..."
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
                            className={`flex items-center justify-between p-3 rounded-xl border transition ${
                              isCaptain
                                ? "bg-yellow-50/50 border-yellow-200"
                                : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {p.profileImage ? (
                                <Image
                                  src={p.profileImage}
                                  alt={p.fullName || p.username}
                                  width={36}
                                  height={36}
                                  className={`w-9 h-9 rounded-full object-cover ${
                                    isCaptain ? "ring-2 ring-yellow-400" : ""
                                  }`}
                                />
                              ) : (
                                <div
                                  className={`w-9 h-9 rounded-full bg-gradient-to-br from-[#667eea] to-[#5a6fd6] flex items-center justify-center font-semibold text-white text-sm ${
                                    isCaptain ? "ring-2 ring-yellow-400" : ""
                                  }`}
                                >
                                  {(
                                    p.fullName?.[0] ||
                                    p.username?.[0] ||
                                    "?"
                                  ).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm text-gray-800">
                                    {p.fullName || p.username}
                                  </span>
                                  {isCaptain && (
                                    <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">
                                      C
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400">@{p.username}</p>
                              </div>
                            </div>
                            {!isCaptain && (
                              <button
                                type="button"
                                className="text-red-500 text-xs font-medium hover:text-red-600 hover:underline transition"
                                onClick={() => removePlayer(p._id)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No players added yet.
                      </p>
                    )}
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl border-gray-300 hover:bg-gray-50"
                onClick={() => router.push("/teams")}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-xl bg-[#667eea] hover:bg-[#5a6fd6] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
