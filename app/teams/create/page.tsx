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
import toast from "react-hot-toast";
import { useState } from "react";
import UserSearchInput from "@/app/match/componets/UserSearchInput";

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  captain: z.string().min(1, "Captain is required"),
  city: z.string().optional(),
  players: z.array(z.string()).min(2, "Add at least 2 players"),
});

type User = { _id: string; username: string; fullName?: string };

export default function CreateTeamPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<string[]>([]);

  const form = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", captain: "", city: "", players: [] },
  });

  const addPlayer = (username: string) => {
    if (username && !players.includes(username)) {
      const updated = [...players, username];
      setPlayers(updated);
      form.setValue("players", updated);
    }
  };

  const removePlayer = (username: string) => {
    const updated = players.filter((p) => p !== username);
    setPlayers(updated);
    form.setValue("players", updated);
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, players };
      const res = await axiosInstance.post("/teams", payload);
      toast.success("Team created!");
      router.push("/teams");
    } catch (err: any) {
      console.error("Error creating team:", err);
      toast.error("Failed to create team");
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
                  onSelect={(u) => addPlayer(u._id)}
                />

                {/* Player List */}
                <div className="mt-3 space-y-2">
                  {players.length > 0 ? (
                    players.map((p) => (
                      <div
                        key={p}
                        className="flex justify-between items-center border p-2 rounded"
                      >
                        <span>{p}</span>
                        <button
                          type="button"
                          className="text-red-500 text-sm"
                          onClick={() => removePlayer(p)}
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
