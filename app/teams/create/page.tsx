"use client";

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
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useState } from "react";
import UserSearchInput from "@/app/match/componets/UserSearchInput";
import Image from "next/image";

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  captain: z.string().min(1, "Captain is required"),
  city: z.string().optional(),
  players: z.array(z.string()).min(2, "Add at least 2 players"),
});

type User = {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
};

export default function CreateTeamPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<User[]>([]);

  const form = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", captain: "", city: "", players: [] },
  });

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
    const updated = players.filter((p) => p._id !== id);
    setPlayers(updated);
    form.setValue(
      "players",
      updated.map((p) => p._id)
    );
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, players: players.map((p) => p._id) };
      await axiosInstance.post("/teams", payload);
      toast.success("Team created!");
      router.push("/teams");
    } catch (err: any) {
      console.error("Error creating team:", err);
      toast.error(err.response?.data?.message || "Failed to create team");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Create New Team</h1>

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

          {/* Captain */}
          <FormField
            control={form.control}
            name="captain"
            render={() => (
              <FormItem>
                <FormLabel>Team Captain</FormLabel>
                <UserSearchInput
                  placeholder="Search captain by username"
                  onSelect={(u) => form.setValue("captain", u._id)}
                />
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
                    players.map((p) => (
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
                              {(p.fullName?.[0] || p.username?.[0] || "?").toUpperCase()}
                            </div>
                          )}
                          <span className="font-medium text-sm">
                            {p.fullName || p.username}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="text-red-500 text-xs font-medium hover:underline"
                          onClick={() => removePlayer(p._id)}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No players added yet.
                    </p>
                  )}
                </div>

                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full">
            Create Team
          </Button>
        </form>
      </Form>
    </div>
  );
}