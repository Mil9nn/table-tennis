"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import TeamSearchInput from "@/components/search/TeamSearchInput";
import CustomFormatConfig from "./CustomFormatConfig";

const schema = z.object({
  matchFormat: z.string().min(1, "Select a team format"),
  setsPerTie: z.enum(["1", "3", "5", "7"]),
  team1Id: z.string().min(1, "Select Team 1"),
  team2Id: z.string().min(1, "Select Team 2"),
  city: z.string().min(1, "Enter city/venue"),
  venue: z.string().optional(),
});

type TeamMatchFormValues = z.infer<typeof schema>;

export default function TeamMatchForm({ endpoint }: { endpoint: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team1Data, setTeam1Data] = useState<any>(null);
  const [team2Data, setTeam2Data] = useState<any>(null);
  const [customConfig, setCustomConfig] = useState<any>(null);
  const router = useRouter();

  const form = useForm<TeamMatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      matchFormat: "five_singles",
      setsPerTie: "3",
      team1Id: "",
      team2Id: "",
      city: "",
      venue: "",
    },
  });

  const matchFormat = form.watch("matchFormat");
  const team1Id = form.watch("team1Id");
  const team2Id = form.watch("team2Id");

  // Fetch team details when team is selected
  useEffect(() => {
    if (team1Id) {
      axiosInstance.get(`/teams/${team1Id}`).then((res) => {
        setTeam1Data(res.data.team);
      });
    }
  }, [team1Id]);

  useEffect(() => {
    if (team2Id) {
      axiosInstance.get(`/teams/${team2Id}`).then((res) => {
        setTeam2Data(res.data.team);
      });
    }
  }, [team2Id]);

  const teamMatchFormats = [
    { value: "five_singles", label: "Swaythling Format [5 singles]" },
    { value: "single_double_single", label: "Single–Double–Single" },
    { value: "custom", label: "Custom Format" },
  ];

  const handleSubmit = async (data: TeamMatchFormValues) => {
    setIsSubmitting(true);
    try {
      if (data.team1Id === data.team2Id) {
        toast.error("Team 1 and Team 2 cannot be the same.");
        return setIsSubmitting(false);
      }

      // Validate custom format
      if (data.matchFormat === "custom") {
        if (!customConfig || !customConfig.matches || customConfig.matches.length === 0) {
          toast.error("Please configure at least one match for custom format");
          return setIsSubmitting(false);
        }

        // Validate all matches have players selected
        const invalidMatch = customConfig.matches.findIndex((m: any) => {
          const requiredPlayers = m.type === "singles" ? 1 : 2;
          return (
            m.team1Players.length !== requiredPlayers ||
            m.team2Players.length !== requiredPlayers ||
            m.team1Players.some((p: string) => !p) ||
            m.team2Players.some((p: string) => !p)
          );
        });

        if (invalidMatch !== -1) {
          toast.error(`Match ${invalidMatch + 1} has incomplete player selection`);
          return setIsSubmitting(false);
        }
      }

      const matchData: any = {
        matchFormat: data.matchFormat,
        setsPerTie: Number(data.setsPerTie),
        city: data.city,
        venue: data.venue || data.city,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
      };

      // Add custom config if custom format
      if (data.matchFormat === "custom") {
        matchData.customConfig = customConfig;
      }

      const response = await axiosInstance.post(endpoint, matchData);
      toast.success("Team match created successfully!");
      router.push(`/matches/${response.data.match._id}?category=team`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create team match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-t-2  border-black/30 bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-semibold text-lg text-foreground tracking-tight">
          Team Match Setup
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Match Format */}
          <FormField
            control={form.control}
            name="matchFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team Match Format</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teamMatchFormats.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Sets Per Tie */}
          <FormField
            control={form.control}
            name="setsPerTie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sets Per Tie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sets per tie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["1", "3", "5", "7"].map((n) => (
                      <SelectItem key={n} value={n}>
                        Best of {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="team1Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team 1</FormLabel>
                  <FormControl>
                    <TeamSearchInput
                      placeholder="Search Team 1"
                      onSelect={(team) => field.onChange(team._id)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="team2Id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team 2</FormLabel>
                  <FormControl>
                    <TeamSearchInput
                      placeholder="Search Team 2"
                      onSelect={(team) => field.onChange(team._id)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Custom Format Configuration */}
          {matchFormat === "custom" && team1Data && team2Data && (
            <CustomFormatConfig
              team1Players={team1Data.players || []}
              team2Players={team2Data.players || []}
              team1Name={team1Data.name}
              team2Name={team2Data.name}
              onChange={setCustomConfig}
            />
          )}

          {/* City */}
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Enter city" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Venue */}
          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter venue" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full p-8 text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin size-5" />
                Creating...
              </>
            ) : (
              "Create Team Match"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}