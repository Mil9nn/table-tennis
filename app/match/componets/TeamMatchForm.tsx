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

// Helper function to get required positions based on match format
const getRequiredPositionsForSchema = (format: string): string[] => {
  switch (format) {
    case "five_singles":
      return ["A", "B", "C"];
    case "single_double_single":
      return ["A", "B"];
    case "custom":
      return [];
    default:
      return [];
  }
};

const getTeam2PositionsForSchema = (format: string): string[] => {
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

const schema = z
  .object({
    matchFormat: z.string().min(1, "Select a team format"),
    setsPerTie: z.enum(["1", "3", "5", "7"]),
    team1Id: z.string().min(1, "Select Team 1"),
    team2Id: z.string().min(1, "Select Team 2"),
    city: z.string().min(1, "Enter city/venue"),
    venue: z.string().min(1, "Venue is required"),
    // These will be set via form.setValue when assignments/config change
    team1Assignments: z.record(z.string(), z.string()).optional(),
    team2Assignments: z.record(z.string(), z.string()).optional(),
    customConfig: z
      .object({
        matches: z.array(
          z.object({
            type: z.enum(["singles", "doubles"]),
            team1Players: z.array(z.string()),
            team2Players: z.array(z.string()),
          })
        ),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Validate teams are different
    if (data.team1Id === data.team2Id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Team 1 and Team 2 cannot be the same",
        path: ["team2Id"],
      });
    }

    // Validate position assignments for formats that need them
    const requiredPositions = getRequiredPositionsForSchema(data.matchFormat);
    const requiredTeam2Positions = getTeam2PositionsForSchema(data.matchFormat);

    if (requiredPositions.length > 0) {
      const team1Assignments = data.team1Assignments || {};
      const team2Assignments = data.team2Assignments || {};

      const team1AssignedPositions = new Set(Object.values(team1Assignments));
      const team2AssignedPositions = new Set(Object.values(team2Assignments));

      const missingTeam1Positions = requiredPositions.filter(
        (pos) => !team1AssignedPositions.has(pos)
      );
      const missingTeam2Positions = requiredTeam2Positions.filter(
        (pos) => !team2AssignedPositions.has(pos)
      );

      if (missingTeam1Positions.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Team 1 missing position assignments: ${missingTeam1Positions.join(", ")}`,
          path: ["team1Assignments"],
        });
      }

      if (missingTeam2Positions.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Team 2 missing position assignments: ${missingTeam2Positions.join(", ")}`,
          path: ["team2Assignments"],
        });
      }
    }

    // Validate custom format
    if (data.matchFormat === "custom") {
      if (!data.customConfig || !data.customConfig.matches || data.customConfig.matches.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please configure at least one match for custom format",
          path: ["customConfig"],
        });
        return; // Early return to avoid further validation
      }

      // Validate all matches have players selected
      data.customConfig.matches.forEach((match, index) => {
        const requiredPlayers = match.type === "singles" ? 1 : 2;
        
        if (match.team1Players.length !== requiredPlayers) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Match ${index + 1}: Team 1 must have ${requiredPlayers} player(s)`,
            path: ["customConfig", "matches", index, "team1Players"],
          });
        }

        if (match.team2Players.length !== requiredPlayers) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Match ${index + 1}: Team 2 must have ${requiredPlayers} player(s)`,
            path: ["customConfig", "matches", index, "team2Players"],
          });
        }

        if (match.team1Players.some((p) => !p)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Match ${index + 1}: Team 1 has incomplete player selection`,
            path: ["customConfig", "matches", index, "team1Players"],
          });
        }

        if (match.team2Players.some((p) => !p)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Match ${index + 1}: Team 2 has incomplete player selection`,
            path: ["customConfig", "matches", index, "team2Players"],
          });
        }
      });
    }
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
      team1Assignments: {},
      team2Assignments: {},
      customConfig: undefined,
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
          form.setValue("team1Assignments", assignmentsObj);
        } else {
          setTeam1Assignments({});
          form.setValue("team1Assignments", {});
        }
      });
    }
  }, [team1Id, form]);

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
          form.setValue("team2Assignments", assignmentsObj);
        } else {
          setTeam2Assignments({});
          form.setValue("team2Assignments", {});
        }
      });
    }
  }, [team2Id, form]);

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
      // Update form value for validation
      form.setValue("team1Assignments", newAssignments, { shouldValidate: true });
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
      // Update form value for validation
      form.setValue("team2Assignments", newAssignments, { shouldValidate: true });
      return newAssignments;
    });
  };

  const handleSubmit = async (data: TeamMatchFormValues) => {
    setIsSubmitting(true);
    try {
      // All validation is now handled by zod schema
      const matchData: any = {
        matchFormat: data.matchFormat,
        setsPerTie: Number(data.setsPerTie),
        city: data.city,
        venue: data.venue,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
        team1Assignments: data.team1Assignments || team1Assignments,
        team2Assignments: data.team2Assignments || team2Assignments,
      };

      // Add custom config if custom format
      if (data.matchFormat === "custom") {
        matchData.customConfig = data.customConfig || customConfig;
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
                <FormMessage />
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
                <FormMessage />
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

              <FormField
                control={form.control}
                name="team1Assignments"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <PositionAssignment
                        teamName={team1Data.name}
                        players={team1Data.players || []}
                        positions={getRequiredPositions(matchFormat)}
                        assignments={team1Assignments}
                        onAssignmentChange={handleTeam1AssignmentChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="team2Assignments"
                render={() => (
                  <FormItem>
                    <FormControl>
                      <PositionAssignment
                        teamName={team2Data.name}
                        players={team2Data.players || []}
                        positions={getTeam2Positions(matchFormat)}
                        assignments={team2Assignments}
                        onAssignmentChange={handleTeam2AssignmentChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Custom Format Configuration */}
          {matchFormat === "custom" && team1Data && team2Data && (
            <FormField
              control={form.control}
              name="customConfig"
              render={() => (
                <FormItem>
                  <FormControl>
                    <CustomFormatConfig
                      team1Players={team1Data.players || []}
                      team2Players={team2Data.players || []}
                      team1Name={team1Data.name}
                      team2Name={team2Data.name}
                      onChange={(config) => {
                        setCustomConfig(config);
                        form.setValue("customConfig", config, { shouldValidate: true });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                <FormMessage />
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
