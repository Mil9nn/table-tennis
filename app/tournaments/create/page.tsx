"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, X, ChevronLeft, ArrowRight } from "lucide-react";
import AdjustIcon from "@mui/icons-material/Adjust";
import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import MultipleStopIcon from "@mui/icons-material/MultipleStop";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";

import { axiosInstance } from "@/lib/axiosInstance";
import UserSearchInput from "@/app/match/componets/UserSearchInput";
import TeamSearchInput from "@/components/search/TeamSearchInput";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import DoublesPairBuilder, {
  DoublesPairData,
} from "@/components/tournaments/DoublesPairBuilder";

import {
  RoundRobinConfig,
  KnockoutConfig,
  TeamConfig,
  QualificationConfig,
} from "./components";
import { Check } from "@mui/icons-material";

// ============================================================================
// CLEAN SCHEMA - Organized by logical sections
// ============================================================================

const tournamentSchema = z
  .object({
    // ═══════════════════════════════════════════
    // BASIC INFO (always required)
    // ═══════════════════════════════════════════
    name: z.string().min(3, "Tournament name must be at least 3 characters"),
    startDate: z.date(),
    city: z.string().min(2, "City is required"),
    venue: z.string().min(3, "Venue must be at least 3 characters"),

    // ═══════════════════════════════════════════
    // TOURNAMENT TYPE
    // ═══════════════════════════════════════════
    format: z.enum(["round_robin", "knockout", "hybrid"]),
    category: z.enum(["individual", "team"]),

    // ═══════════════════════════════════════════
    // MATCH SETTINGS
    // ═══════════════════════════════════════════
    // Note: matchType is always required (even for teams)
    matchType: z.enum(["singles", "doubles"]),
    // setsPerMatch only used for individual tournaments (team tournaments use teamConfig.setsPerSubMatch)
    setsPerMatch: z.enum(["1", "3", "5", "7", "9"]).optional(),

    // ═══════════════════════════════════════════
    // PARTICIPANTS (stored in form for validation)
    // ═══════════════════════════════════════════
    participants: z
      .array(z.string())
      .min(2, "At least 2 participants are required"),

    // Doubles pairs (optional, for doubles)
    doublesPairs: z
      .array(
        z.object({
          _id: z.string(),
          player1: z.string(),
          player2: z.string(),
        })
      )
      .optional(),

    // ═══════════════════════════════════════════
    // TEAM CONFIG (only when category === "team")
    // ═══════════════════════════════════════════
    teamConfig: z
      .object({
        matchFormat: z.enum(["five_singles", "single_double_single", "custom"]),
        setsPerSubMatch: z.string(),
      })
      .optional(),

    // ═══════════════════════════════════════════
    // ROUND ROBIN CONFIG (format === "round_robin" OR hybrid phase 1)
    // ═══════════════════════════════════════════
    useGroups: z.boolean(),
    numberOfGroups: z.string().optional(),
    advancePerGroup: z.string().optional(),

    // ═══════════════════════════════════════════
    // KNOCKOUT CONFIG (format === "knockout" OR hybrid phase 2)
    // ═══════════════════════════════════════════
    knockout: z
      .object({
        thirdPlaceMatch: z.boolean(),
        allowCustomMatching: z.boolean(),
      })
      .optional(),

    // ═══════════════════════════════════════════
    // HYBRID-SPECIFIC: Round Robin phase groups
    // ═══════════════════════════════════════════
    hybridRoundRobin: z
      .object({
        useGroups: z.boolean(),
        numberOfGroups: z.string().optional(),
      })
      .optional(),

    // ═══════════════════════════════════════════
    // HYBRID-SPECIFIC: Qualification settings
    // ═══════════════════════════════════════════
    qualification: z
      .object({
        method: z.enum(["top_n_per_group"]),
        perGroup: z.string().optional(),
      })
      .optional(),

    // ═══════════════════════════════════════════
    // HYBRID-SPECIFIC: Knockout phase settings
    // ═══════════════════════════════════════════
    hybridKnockout: z
      .object({
        thirdPlaceMatch: z.boolean(),
        allowCustomMatching: z.boolean(),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Validate: Individual tournaments must have setsPerMatch
    if (data.category === "individual" && !data.setsPerMatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Sets per match is required for individual tournaments",
        path: ["setsPerMatch"],
      });
    }

    // Validate: Round-robin format cannot use groups
    // Groups only make sense when there's a next phase (use hybrid format instead)
    if (data.format === "round_robin" && data.useGroups) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Groups cannot be used with round-robin format. Groups are only meaningful when there's a next phase. Please use 'hybrid' format for round-robin → knockout tournaments, or disable groups for pure round-robin.",
        path: ["useGroups"],
      });
    }

    // Validate: Hybrid format groups
    if (data.format === "hybrid" && data.hybridRoundRobin?.useGroups) {
      const numGroups = Number(data.hybridRoundRobin.numberOfGroups || 0);

      if (numGroups < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least 2 groups required for round-robin phase",
          path: ["hybridRoundRobin", "numberOfGroups"],
        });
      }

      if (data.participants.length < numGroups) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Need at least ${numGroups} participants for ${numGroups} groups`,
          path: ["participants"],
        });
      }
    }
  });

type TournamentFormValues = z.infer<typeof tournamentSchema>;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CreateTournamentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [doublesPairs, setDoublesPairs] = useState<DoublesPairData[]>([]);
  const [startDateOpen, setStartDateOpen] = useState(false);

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      city: "",
      venue: "",

      format: "round_robin",
      category: "individual",

      matchType: "singles",
      setsPerMatch: "3",

      // Participants (synced with state)
      participants: [],

      // Team config defaults
      teamConfig: {
        matchFormat: "five_singles",
        setsPerSubMatch: "3",
      },

      // Round Robin defaults
      // Note: Groups are not allowed for round-robin format (no next phase)
      useGroups: false,
      numberOfGroups: undefined,
      advancePerGroup: undefined,

      // Knockout defaults
      knockout: {
        thirdPlaceMatch: false,
        allowCustomMatching: true,
      },

      // Hybrid Round Robin defaults
      hybridRoundRobin: {
        useGroups: false,
        numberOfGroups: "4",
      },

      // Qualification defaults
      qualification: {
        method: "top_n_per_group",
        perGroup: "2",
      },

      // Hybrid Knockout defaults
      hybridKnockout: {
        thirdPlaceMatch: false,
        allowCustomMatching: true,
      },
    },
  });

  const watchFormat = form.watch("format");
  const watchCategory = form.watch("category");
  const watchMatchType = form.watch("matchType");
  const watchUseGroups = form.watch("useGroups");
  const watchHybridUseGroups = form.watch("hybridRoundRobin.useGroups");
  const watchQualMethod = form.watch("qualification.method");

  // Reset and enforce "top_n_per_group" as the only qualification method
  useEffect(() => {
    if (watchFormat === "hybrid" && watchQualMethod !== "top_n_per_group") {
      form.setValue("qualification.method", "top_n_per_group");
    }
  }, [watchFormat, watchQualMethod, form]);

  const addParticipant = (user: any) => {
    if (!participants.find((p) => p._id === user._id)) {
      const updated = [...participants, user];
      setParticipants(updated);
      // Sync with form for validation
      form.setValue(
        "participants",
        updated.map((p) => p._id),
        { shouldValidate: true }
      );
    }
  };

  const removeParticipant = (userId: string) => {
    const updated = participants.filter((p) => p._id !== userId);
    setParticipants(updated);
    // Sync with form for validation
    form.setValue(
      "participants",
      updated.map((p) => p._id),
      { shouldValidate: true }
    );

    // Clear pairs if removing a participant from doubles tournament
    if (
      watchMatchType === "doubles"
    ) {
      // Remove pairs that include the removed participant
      const updatedPairs = doublesPairs.filter(
        (pair) =>
          pair.player1._id !== userId && pair.player2._id !== userId
      );
      setDoublesPairs(updatedPairs);
      form.setValue(
        "doublesPairs",
        updatedPairs.map((p) => ({
          _id: p._id,
          player1: p.player1._id,
          player2: p.player2._id,
        }))
      );
    }
  };

  // ═══════════════════════════════════════════
  // FORM SUBMISSION - Map to API format
  // ═══════════════════════════════════════════
  const onSubmit = async (data: TournamentFormValues) => {
    // All validation is now handled by zod schema
    setIsSubmitting(true);
    try {
      // DEBUG: Log form data
      console.log("🔵 [CREATE FORM] Form data received:", {
        category: data.category,
        teamConfig: data.teamConfig,
        teamConfig_setsPerSubMatch: data.teamConfig?.setsPerSubMatch,
        setsPerMatch: data.setsPerMatch,
      });

      // Build the API payload
      const payload: any = {
        name: data.name,
        format: data.format,
        category: data.category,
        matchType: data.matchType,
        startDate: data.startDate,
        city: data.city,
        venue: data.venue,
        participants: data.participants,
        seedingMethod: "none",
        rules: {
          // For team tournaments, set setsPerMatch to match setsPerSubMatch for consistency
          // The actual match generation uses teamConfig.setsPerSubMatch
          setsPerMatch:
            data.category === "team"
              ? Number(data.teamConfig?.setsPerSubMatch) || 3
              : Number(data.setsPerMatch),
          pointsPerSet: 11,
          pointsForWin: 2,
          advanceTop: 0,
          deuceSetting: "standard",
          tiebreakRules: [
            "points",
            "head_to_head",
            "sets_ratio",
            "points_ratio",
            "sets_won",
          ],
        },
      };

      // Round Robin specific
      // Note: Groups are not allowed for round-robin format (validated above)
      if (data.format === "round_robin") {
        payload.useGroups = false; // Force false for round-robin
        payload.numberOfGroups = undefined;
        payload.advancePerGroup = undefined;
      }

      // Knockout specific
      if (data.format === "knockout") {
        payload.knockoutConfig = {
          allowCustomMatching: data.knockout?.allowCustomMatching ?? true,
          autoGenerateBracket: true,
          thirdPlaceMatch: data.knockout?.thirdPlaceMatch ?? false,
          consolationBracket: false,
        };
      }

      // Hybrid specific
      if (data.format === "hybrid") {
        payload.hybridConfig = {
          roundRobinUseGroups: data.hybridRoundRobin?.useGroups ?? false,
          roundRobinNumberOfGroups: data.hybridRoundRobin?.useGroups
            ? Number(data.hybridRoundRobin.numberOfGroups)
            : undefined,
          qualificationMethod: "top_n_per_group",
          qualifyingPerGroup: Number(data.qualification?.perGroup) || 2,
          knockoutAllowCustomMatching:
            data.hybridKnockout?.allowCustomMatching ?? true,
          knockoutThirdPlaceMatch:
            data.hybridKnockout?.thirdPlaceMatch ?? false,
        };
      }

      // Team config
      if (data.category === "team") {
        payload.teamConfig = {
          matchFormat: data.teamConfig?.matchFormat || "five_singles",
          setsPerSubMatch: Number(data.teamConfig?.setsPerSubMatch) || 3,
        };
      }

      // Doubles pairs
      if (
        data.category === "individual" &&
        data.matchType === "doubles" &&
        data.doublesPairs &&
        data.doublesPairs.length > 0
      ) {
        payload.doublesPairs = data.doublesPairs;
      }

      // DEBUG: Log payload being sent
      console.log("🟢 [CREATE FORM] Payload being sent to API:", {
        category: payload.category,
        teamConfig: payload.teamConfig,
        rules_setsPerMatch: payload.rules.setsPerMatch,
        doublesPairs: payload.doublesPairs,
      });

      const response = await axiosInstance.post("/tournaments", payload);

      // DEBUG: Log response
      console.log("🟡 [CREATE FORM] Tournament created:", {
        id: response.data.tournament._id,
        teamConfig: response.data.tournament.teamConfig,
        rules_setsPerMatch: response.data.tournament.rules?.setsPerMatch,
      });
      toast.success("Tournament created successfully!");
      router.push(`/tournaments/${response.data.tournament._id}`);
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      toast.error(err.response?.data?.error || "Failed to create tournament");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ═══════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* HEADER: Precise & Architectural */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h1 className="text-sm font-semibold text-foreground">
            Create tournament
          </h1>
        </div>
      </header>

      <main className="mx-auto py-8">
        <Form {...form}>
          {/* FORMAT SELECTOR: High Density Toggle */}
          <div className="mb-10 px-4">
  <div className="mb-5">
    <h2 className="text-sm font-semibold text-foreground">
      Select Format
    </h2>
    <div className="h-[2px] w-10 rounded-full bg-primary/70 mt-1" />
  </div>

  <FormField
    control={form.control}
    name="format"
    render={({ field }) => (
      <FormItem>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            {
              type: "round_robin" as const,
              title: "Round Robin",
              
              icon: AdjustIcon,
            },
            {
              type: "knockout" as const,
              title: "Knockout",
              
              icon: DonutLargeIcon,
            },
            {
              type: "hybrid" as const,
              title: "Hybrid",
              
              icon: MultipleStopIcon,
            },
          ].map((option) => {
            const isActive = field.value === option.type;
            const Icon = option.icon;

            return (
              <button
                key={option.type}
                type="button"
                onClick={() => field.onChange(option.type)}
                className={cn(
                  "relative rounded-xl border p-4 text-left transition-all",
                  "bg-background hover:border-primary/50 hover:shadow-sm",
                  isActive
                    ? "border-primary shadow-md"
                    : "border-border"
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-md",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-primary"
                    )}
                  >
                    <Icon sx={{ fontSize: 16 }} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold leading-none">
                      {option.title}
                    </h3>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="formatCheck"
                      className="text-primary"
                    >
                      <Check sx={{ fontSize: 16 }} />
                    </motion.div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <FormMessage />
      </FormItem>
    )}
  />
</div>


          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 max-w-3xl mx-auto px-4">
            {/* BASIC INFO */}
            <section className="space-y-5">
              <h3 className="text-sm font-semibold text-foreground">
                Basic Information
              </h3>

              {/* Tournament Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Tournament name
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Spring Championship 2025" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* City + Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        City
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground">
                        Venue
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Club / Arena" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Start Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-xs text-muted-foreground">
                      Start date
                    </FormLabel>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setStartDateOpen(false);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            {/* CATEGORY */}
            <section className="space-y-5">
              <h3 className="text-sm font-semibold text-foreground">
                Category
              </h3>

              <FormField
  control={form.control}
  name="category"
  render={({ field }) => (
    <FormItem>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            type: "individual" as const,
            title: "Individual",
            
            icon: PersonIcon,
          },
          {
            type: "team" as const,
            title: "Team",
            
            icon: GroupsIcon,
          },
        ].map((option) => {
          const isActive = field.value === option.type;
          const Icon = option.icon;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => field.onChange(option.type)}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-all",
                "bg-background hover:border-primary/50 hover:shadow-sm",
                isActive
                  ? "border-primary shadow-md"
                  : "border-border"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-primary"
                  )}
                >
                  <Icon sx={{ fontSize: 16 }} />
                </div>

                <div className="flex-1">
                  <h3 className="text-sm font-semibold leading-none">
                    {option.title}
                  </h3>
                </div>

                {isActive && (
                  <motion.div
                    layoutId="categoryCheck"
                    className="text-primary"
                  >
                    <Check sx={{ fontSize: 16 }} />
                  </motion.div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <FormMessage />
    </FormItem>
  )}
/>

            </section>

            {/* MATCH SETTINGS */}
            <section className="space-y-5">
              <h3 className="text-sm font-semibold text-foreground">
                {watchCategory === "team" ? "Match format" : "Match format"}
              </h3>

              {/* Individual tournament: Show match type & sets */}
              {watchCategory === "individual" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Type
                        </FormLabel>
                        <div className="flex rounded-lg bg-muted p-1">
                          {["singles", "doubles"].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => field.onChange(type)}
                              className={cn(
                                "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                                field.value === type
                                  ? "bg-background shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="setsPerMatch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">
                          Best of
                        </FormLabel>
                        <div className="flex gap-1 bg-muted p-1 rounded-lg">
                          {["1", "3", "5", "7", "9"].map((n) => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => field.onChange(n)}
                              className={cn(
                                "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                                field.value === n
                                  ? "bg-background shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Team tournament: Show team config */}
              {watchCategory === "team" && <TeamConfig form={form} />}
            </section>

            {/* FORMAT-SPECIFIC OPTIONS */}
            {(watchFormat === "knockout" || watchFormat === "hybrid") && (
              <section className="space-y-5">
                <h3 className="text-sm font-semibold text-foreground">
                  {watchFormat === "knockout" && "Knockout settings"}
                  {watchFormat === "hybrid" && "Hybrid tournament settings"}
                </h3>

                {/* KNOCKOUT FORMAT */}
                {watchFormat === "knockout" && (
                  <KnockoutConfig form={form} prefix="knockout" />
                )}

                {/* HYBRID FORMAT */}
                {watchFormat === "hybrid" && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Round robin phase
                      </h4>
                      <RoundRobinConfig
                        form={form}
                        prefix="hybridRoundRobin"
                        title=""
                        showAdvancePerGroup={false}
                      />
                    </div>

                    <QualificationConfig
                      form={form}
                      useGroups={watchHybridUseGroups ?? false}
                    />

                    <div className="space-y-4">
                      <h4 className="text-xs font-medium text-muted-foreground">
                        Knockout phase
                      </h4>
                      <KnockoutConfig form={form} prefix="hybridKnockout" />
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* PARTICIPANTS */}
            <section className="space-y-5">
              <h3 className="text-sm font-semibold text-foreground">
                {watchCategory === "team" ? "Teams" : "Participants"}
              </h3>

              <FormField
                control={form.control}
                name="participants"
                render={() => (
                  <FormItem>
                    <FormControl>
                      {watchCategory === "team" ? (
                        <TeamSearchInput
                          placeholder="Search teams..."
                          onSelect={addParticipant}
                          clearAfterSelect
                        />
                      ) : (
                        <UserSearchInput
                          placeholder="Search players..."
                          onSelect={addParticipant}
                          clearAfterSelect
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {participants.length > 0 ? (
                <div className="space-y-2">
                  <AnimatePresence>
                    {participants.map((p, idx) => (
                      <motion.div
                        key={p._id}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-3 rounded-md border bg-background hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {watchCategory === "team"
                                ? p.name
                                : p.fullName || p.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {watchCategory === "team"
                                ? `${p.players?.length || 0} players`
                                : `@${p.username}`}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeParticipant(p._id)}
                          className="text-muted-foreground hover:text-foreground transition p-1 rounded-md hover:bg-muted"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
                  <p className="text-sm">
                    No {watchCategory === "team" ? "teams" : "participants"} added yet
                  </p>
                </div>
              )}
            </section>

            {/* DOUBLES PAIRS */}
            {watchCategory === "individual" &&
              watchMatchType === "doubles" &&
              participants.length >= 2 && (
                <section className="space-y-5">
                  <h3 className="text-sm font-semibold text-foreground">
                    Doubles pairs
                  </h3>

                  {participants.length % 2 !== 0 && (
                    <div className="p-3 rounded-md bg-amber-50 border border-amber-200">
                      <p className="text-sm text-amber-800">
                        You have an odd number of players. Please add or remove one player.
                      </p>
                    </div>
                  )}

                  <DoublesPairBuilder
                    participants={participants}
                    existingPairs={doublesPairs}
                    onPairsChange={(pairs) => {
                      setDoublesPairs(pairs);
                      form.setValue(
                        "doublesPairs",
                        pairs.map((p) => ({
                          _id: p._id,
                          player1: p.player1._id,
                          player2: p.player2._id,
                        }))
                      );
                    }}
                  />
                </section>
              )}

            {/* CTA */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-sm font-medium"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create tournament"
              )}
            </Button>
          </form>
        </Form>
      </main>
    </div>
  );
}
