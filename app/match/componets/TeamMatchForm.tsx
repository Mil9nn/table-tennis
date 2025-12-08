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
import PositionAssignment from "./PositionAssignment";

const schema = z.object({
  matchFormat: z.string().min(1, "Select a team format"),
  setsPerTie: z.enum(["1", "3", "5", "7"]),
  team1Id: z.string().min(1, "Select Team 1"),
  team2Id: z.string().min(1, "Select Team 2"),
  city: z.string().min(1, "Enter city/venue"),
  venue: z.string().min(1, "Venue is required"),
});

type TeamMatchFormValues = z.infer<typeof schema>;

export default function TeamMatchForm({ endpoint }: { endpoint: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team1Data, setTeam1Data] = useState<any>(null);
  const [team2Data, setTeam2Data] = useState<any>(null);
  const [customConfig, setCustomConfig] = useState<any>(null);
  const [team1Assignments, setTeam1Assignments] = useState<Record<string, string>>({});
  const [team2Assignments, setTeam2Assignments] = useState<Record<string, string>>({});
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
        const team = res.data.team;
        setTeam1Data(team);
        // Initialize assignments from existing team data if available
        if (team.assignments) {
          const assignmentsObj: Record<string, string> = {};
          for (const [key, value] of Object.entries(team.assignments)) {
            assignmentsObj[key] = value as string;
          }
          setTeam1Assignments(assignmentsObj);
        } else {
          setTeam1Assignments({});
        }
      });
    }
  }, [team1Id]);

  useEffect(() => {
    if (team2Id) {
      axiosInstance.get(`/teams/${team2Id}`).then((res) => {
        const team = res.data.team;
        setTeam2Data(team);
        // Initialize assignments from existing team data if available
        if (team.assignments) {
          const assignmentsObj: Record<string, string> = {};
          for (const [key, value] of Object.entries(team.assignments)) {
            assignmentsObj[key] = value as string;
          }
          setTeam2Assignments(assignmentsObj);
        } else {
          setTeam2Assignments({});
        }
      });
    }
  }, [team2Id]);

  const teamMatchFormats = [
    { value: "five_singles", label: "Swaythling Format [5 singles]" },
    { value: "single_double_single", label: "Single–Double–Single" },
    { value: "custom", label: "Custom Format" },
  ];

  // Get required positions based on match format
  const getRequiredPositions = (format: string): string[] => {
    switch (format) {
      case "five_singles":
        return ["A", "B", "C"];
      case "single_double_single":
        return ["A", "B"];
      case "custom":
        return []; // No fixed positions for custom
      default:
        return [];
    }
  };

  // For team 2, use X, Y, Z instead of A, B, C
  const getTeam2Positions = (format: string): string[] => {
    switch (format) {
      case "five_singles":
        return ["X", "Y", "Z"];
      case "single_double_single":
        return ["X", "Y"];
      case "custom":
        return [];
      default:
        return [];
    }
  };

  const handleTeam1AssignmentChange = (playerId: string, position: string | null) => {
    setTeam1Assignments((prev) => {
      const newAssignments = { ...prev };
      if (position === null) {
        delete newAssignments[playerId];
      } else {
        newAssignments[playerId] = position;
      }
      return newAssignments;
    });
  };

  const handleTeam2AssignmentChange = (playerId: string, position: string | null) => {
    setTeam2Assignments((prev) => {
      const newAssignments = { ...prev };
      if (position === null) {
        delete newAssignments[playerId];
      } else {
        newAssignments[playerId] = position;
      }
      return newAssignments;
    });
  };

  const handleSubmit = async (data: TeamMatchFormValues) => {
    setIsSubmitting(true);
    try {
      if (data.team1Id === data.team2Id) {
        toast.error("Team 1 and Team 2 cannot be the same.");
        return setIsSubmitting(false);
      }

      // Validate position assignments for formats that need them
      const requiredPositions = getRequiredPositions(data.matchFormat);
      const requiredTeam2Positions = getTeam2Positions(data.matchFormat);

      if (requiredPositions.length > 0) {
        const team1AssignedPositions = new Set(Object.values(team1Assignments));
        const team2AssignedPositions = new Set(Object.values(team2Assignments));

        const missingTeam1Positions = requiredPositions.filter(
          pos => !team1AssignedPositions.has(pos)
        );
        const missingTeam2Positions = requiredTeam2Positions.filter(
          pos => !team2AssignedPositions.has(pos)
        );

        if (missingTeam1Positions.length > 0) {
          toast.error(
            `Team 1 missing position assignments: ${missingTeam1Positions.join(", ")}`
          );
          return setIsSubmitting(false);
        }

        if (missingTeam2Positions.length > 0) {
          toast.error(
            `Team 2 missing position assignments: ${missingTeam2Positions.join(", ")}`
          );
          return setIsSubmitting(false);
        }
      }

      // Validate custom format
      if (data.matchFormat === "custom") {
        if (
          !customConfig ||
          !customConfig.matches ||
          customConfig.matches.length === 0
        ) {
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
          toast.error(
            `Match ${invalidMatch + 1} has incomplete player selection`
          );
          return setIsSubmitting(false);
        }
      }

      const matchData: any = {
        matchFormat: data.matchFormat,
        setsPerTie: Number(data.setsPerTie),
        city: data.city,
        venue: data.venue,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        team1Assignments,
        team2Assignments,
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
    <div className="p-6">
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
          {/* Sets Per Tie (Buttons) */}
          <FormField
            control={form.control}
            name="setsPerTie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sets Per Tie</FormLabel>

                <div className="flex gap-2 mt-2 flex-wrap">
                  {["1", "3", "5", "7"].map((n) => {
                    const selected = field.value === n;

                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => field.onChange(n)}
                        className={`px-4 py-2 rounded-xl text-sm border transition-all
                ${
                  selected
                    ? "bg-[#667EEA] text-white border-transparent shadow"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }
              `}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
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

          {/* Position Assignment for non-custom formats */}
          {matchFormat !== "custom" &&
           getRequiredPositions(matchFormat).length > 0 &&
           team1Data &&
           team2Data && (
            <div className="space-y-4">
              <div className="">
                <h3 className="text-sm font-medium">Assign Player Positions</h3>
              </div>

              <PositionAssignment
                teamName={team1Data.name}
                players={team1Data.players || []}
                positions={getRequiredPositions(matchFormat)}
                assignments={team1Assignments}
                onAssignmentChange={handleTeam1AssignmentChange}
              />

              <PositionAssignment
                teamName={team2Data.name}
                players={team2Data.players || []}
                positions={getTeam2Positions(matchFormat)}
                assignments={team2Assignments}
                onAssignmentChange={handleTeam2AssignmentChange}
              />
            </div>
          )}

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
                <FormLabel>Venue</FormLabel>
                <FormControl>
                  <Input placeholder="Enter venue" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full py-6 rounded-xl bg-[#667eea] hover:bg-[#5a6fe0] text-white text-sm font-medium shadow-md"
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
