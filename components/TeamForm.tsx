"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";

// --- Schema ---
const teamSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  captain: z.string().min(1, "Captain is required"),
  players: z.array(z.string().min(1, "Player name cannot be empty")).min(3, "At least 3 players required"),
  newPlayer: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

export default function SimpleTeamForm() {
  const [players, setPlayers] = useState<string[]>([]);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
      captain: "",
      players: [],
      newPlayer: "",
    },
  });

  const addPlayer = () => {
    const newPlayer = form.getValues("newPlayer")?.trim();
    if (newPlayer && !players.includes(newPlayer)) {
      const updated = [...players, newPlayer];
      setPlayers(updated);
      form.setValue("players", updated);
      form.setValue("newPlayer", ""); // reset
    }
  };

  const removePlayer = (p: string) => {
    const updated = players.filter((pl) => pl !== p);
    setPlayers(updated);
    form.setValue("players", updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPlayer();
    }
  };

  const onSubmit = (data: TeamFormValues) => {
    console.log("Form submitted:", {
      ...data,
      players,
    });
    alert("Team submitted! Check console.");
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-4">Create Team</h2>

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
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Captain</FormLabel>
                <FormControl>
                  <Input placeholder="Enter captain name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Players */}
          <div>
            <FormLabel>Players (min 3 required)</FormLabel>
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="newPlayer"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="Add player name"
                          {...field}
                          onKeyPress={handleKeyPress}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="button" variant="outline" onClick={addPlayer}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Player badges */}
              <div className="flex flex-wrap gap-2">
                {players.map((p, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    {p}
                    <button
                      type="button"
                      onClick={() => removePlayer(p)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {players.length < 3 && (
                <p className="text-sm text-muted-foreground">
                  Add at least {3 - players.length} more player
                  {3 - players.length === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4 pt-4">
            <Button type="submit" disabled={players.length < 3}>
              Save Team
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
