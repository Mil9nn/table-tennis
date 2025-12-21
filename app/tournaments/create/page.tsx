"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { CalendarIcon, Loader2, X, ChevronLeft } from "lucide-react";
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

import {
  RoundRobinConfig,
  KnockoutConfig,
  TeamConfig,
  QualificationConfig,
} from "./components";

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
    matchType: z.enum(["singles", "doubles", "mixed_doubles"]),
    // setsPerMatch only used for individual tournaments (team tournaments use teamConfig.setsPerSubMatch)
    setsPerMatch: z.enum(["1", "3", "5", "7", "9"]).optional(),

    // ═══════════════════════════════════════════
    // PARTICIPANTS (stored in form for validation)
    // ═══════════════════════════════════════════
    participants: z
      .array(z.string())
      .min(2, "At least 2 participants are required"),

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
        method: z.enum(["top_n_overall", "top_n_per_group", "percentage"]),
        count: z.string().optional(),
        perGroup: z.string().optional(),
        percentage: z.string().optional(),
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
        method: "top_n_overall",
        count: "8",
        perGroup: "2",
        percentage: "50",
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
  const watchUseGroups = form.watch("useGroups");
  const watchHybridUseGroups = form.watch("hybridRoundRobin.useGroups");
  const watchQualMethod = form.watch("qualification.method");

  // Reset qualification method if "top_n_per_group" selected but groups disabled
  useEffect(() => {
    if (
      watchFormat === "hybrid" &&
      !watchHybridUseGroups &&
      watchQualMethod === "top_n_per_group"
    ) {
      form.setValue("qualification.method", "top_n_overall");
    }
  }, [watchFormat, watchHybridUseGroups, watchQualMethod, form]);

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
          setsPerMatch: data.category === "team" 
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
          qualificationMethod: data.qualification?.method || "top_n_overall",
          qualifyingCount:
            data.qualification?.method === "top_n_overall"
              ? Number(data.qualification.count)
              : undefined,
          qualifyingPerGroup:
            data.qualification?.method === "top_n_per_group"
              ? Number(data.qualification.perGroup)
              : undefined,
          qualifyingPercentage:
            data.qualification?.method === "percentage"
              ? Number(data.qualification.percentage)
              : undefined,
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

      // DEBUG: Log payload being sent
      console.log("🟢 [CREATE FORM] Payload being sent to API:", {
        category: payload.category,
        teamConfig: payload.teamConfig,
        rules_setsPerMatch: payload.rules.setsPerMatch,
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
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      {/* Header */}
      <header className="flex items-center gap-3 p-4 text-white">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Create Tournament</h1>
          <p className="text-sm text-white/70">Setup your competition</p>
        </div>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="mx-auto bg-white shadow-xl overflow-hidden"
        >
          <div className="">
            {/* ═══════════════════════════════════════════
                SECTION 1: BASIC INFO
            ═══════════════════════════════════════════ */}
            <div className="p-4 space-y-3 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-[#667eea]">
                Basic Information
              </h2>

              {/* Tournament Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Tournament Name
                    </FormLabel>

                    <FormControl>
                      <Input
                        className="bg-gray-50 border-gray-200 rounded-lg h-10 text-sm
                       placeholder:text-gray-400 placeholder:opacity-70"
                        placeholder="Spring Championship 2025"
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* City + Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        City
                      </FormLabel>

                      <FormControl>
                        <Input
                          className="bg-gray-50 border-gray-200 rounded-lg h-10 text-sm
                         placeholder:text-gray-400 placeholder:opacity-70"
                          placeholder="New York"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Venue
                      </FormLabel>

                      <FormControl>
                        <Input
                          className="bg-gray-50 border-gray-200 rounded-lg h-10 text-sm
                         placeholder:text-gray-400 placeholder:opacity-70"
                          placeholder="Sports Center"
                          {...field}
                        />
                      </FormControl>

                      <FormMessage className="text-xs" />
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
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Start Date
                    </FormLabel>

                    <Popover
                      open={startDateOpen}
                      onOpenChange={setStartDateOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal text-sm bg-gray-50 h-10 rounded-lg border-gray-200",
                              !field.value && "text-gray-400"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-40" />
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

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* ═══════════════════════════════════════════
                SECTION 2: TOURNAMENT TYPE
            ═══════════════════════════════════════════ */}
            <div className="p-4 space-y-4 border-b">
              <h2 className="text-lg font-semibold text-[#667eea]">
                Tournament Type
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Format</FormLabel>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          {
                            label: "Round Robin",
                            value: "round_robin",
                            Icon: AdjustIcon,
                          },
                          {
                            label: "Knockout",
                            value: "knockout",
                            Icon: DonutLargeIcon,
                          },
                          {
                            label: "Hybrid",
                            value: "hybrid",
                            Icon: MultipleStopIcon,
                          },
                        ].map((opt) => {
                          const isActive = field.value === opt.value;
                          const IconComponent = opt.Icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                "w-fit p-1 px-4 text-xs rounded-xl border-2 transition-all flex flex-row items-center gap-2",
                                isActive
                                  ? "bg-[#667eea] text-white border-[#667eea] shadow-lg scale-105"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#667eea]/50"
                              )}
                            >
                              <IconComponent
                                sx={{ fontSize: 16 }}
                                className={cn(
                                  "flex-shrink-0",
                                  isActive ? "text-white" : "text-gray-500"
                                )}
                              />
                              <span className="whitespace-nowrap">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700">Category</FormLabel>
                      <div className="flex items-center gap-2 flex-wrap">
                        {[
                          {
                            label: "Individual",
                            value: "individual",
                            Icon: PersonIcon,
                          },
                          { label: "Team", value: "team", Icon: GroupsIcon },
                        ].map((opt) => {
                          const isActive = field.value === opt.value;
                          const IconComponent = opt.Icon;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={cn(
                                "p-2 px-4 text-xs rounded-xl border-2 transition-all flex flex-row items-center justify-center gap-2",
                                isActive
                                  ? "bg-[#667eea] text-white border-[#667eea] shadow-lg scale-105"
                                  : "bg-gray-50 text-gray-600 border-gray-200 hover:border-[#667eea]/50"
                              )}
                            >
                              <IconComponent
                                sx={{ fontSize: 16 }}
                                className={cn(
                                  "flex-shrink-0",
                                  isActive ? "text-white" : "text-gray-500"
                                )}
                              />
                              <span className="whitespace-nowrap">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* ═══════════════════════════════════════════
                SECTION 3: MATCH SETTINGS
            ═══════════════════════════════════════════ */}
            <div className="p-5 space-y-4 border-b">
              <h2 className="text-lg font-semibold text-[#667eea]">
                {watchCategory === "team"
                  ? "Team Match Format"
                  : "Match Settings"}
              </h2>

              {/* Individual tournament: Show match type & sets */}
              {watchCategory === "individual" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="matchType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700">
                          Match Type
                        </FormLabel>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { label: "Singles", value: "singles" },
                            { label: "Doubles", value: "doubles" },
                            { label: "Mixed", value: "mixed_doubles" },
                          ].map((opt) => {
                            const isActive = field.value === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => field.onChange(opt.value)}
                                className={cn(
                                  "px-4 py-2 text-xs rounded-lg border transition-all",
                                  isActive
                                    ? "bg-[#667eea] text-white shadow"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                )}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
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
                        <FormLabel className="text-gray-700">
                          Sets Per Match
                        </FormLabel>
                        <div className="flex gap-2">
                          {["1", "3", "5", "7", "9"].map((n) => {
                            const isActive = field.value === n;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => field.onChange(n)}
                                className={cn(
                                  "w-10 h-10 text-sm rounded-lg border transition-all",
                                  isActive
                                    ? "bg-[#667eea] text-white shadow"
                                    : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                )}
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
                </div>
              )}

              {/* Team tournament: Show team config (match structure + sets per submatch) */}
              {watchCategory === "team" && <TeamConfig form={form} />}
            </div>

            {/* ═══════════════════════════════════════════
                SECTION 4: FORMAT-SPECIFIC OPTIONS
            ═══════════════════════════════════════════ */}
            <div className="p-5 space-y-4 border-b">
              <h2 className="text-lg font-semibold text-[#667eea]">
                {watchFormat === "knockout" && "Knockout Settings"}
                {watchFormat === "hybrid" && "Hybrid Tournament Settings"}
                {watchFormat === "round_robin" && "Round Robin Settings"}
              </h2>

              {/* ROUND ROBIN FORMAT */}
              {watchFormat === "round_robin" && (
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    Pure round-robin tournaments play all participants against each other without groups or knockout phases.
                  </p>
                </div>
              )}

              {/* KNOCKOUT FORMAT */}
              {watchFormat === "knockout" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                  <KnockoutConfig form={form} prefix="knockout" />
                </div>
              )}

              {/* HYBRID FORMAT */}
              {watchFormat === "hybrid" && (
                <div className="space-y-4">
                  {/* Phase 1: Round Robin */}
                  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        PHASE 1
                      </span>
                      <span className="text-sm font-medium text-blue-800">
                        Round Robin
                      </span>
                    </div>
                    <RoundRobinConfig
                      form={form}
                      prefix="hybridRoundRobin"
                      title=""
                      showAdvancePerGroup={false}
                    />
                  </div>

                  {/* Qualification */}
                  <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                    {watchQualMethod === "top_n_per_group" && !watchHybridUseGroups && (
                      <div className="mb-4 p-3 rounded-lg bg-yellow-100 border border-yellow-300">
                        <p className="text-xs text-yellow-800">
                          <span className="font-semibold">Note:</span> "Top N Per Group" requires groups to be enabled in Phase 1. Reverting to "Top N Overall".
                        </p>
                      </div>
                    )}
                    <QualificationConfig
                      form={form}
                      useGroups={watchHybridUseGroups ?? false}
                    />
                  </div>

                  {/* Phase 2: Knockout */}
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded">
                        PHASE 2
                      </span>
                      <span className="text-sm font-medium text-amber-800">
                        Knockout
                      </span>
                    </div>
                    <KnockoutConfig form={form} prefix="hybridKnockout" />
                  </div>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════
                SECTION 5: PARTICIPANTS
            ═══════════════════════════════════════════ */}
            <div className="p-5 space-y-4">
              <h2 className="text-lg font-semibold text-[#667eea]">
                {watchCategory === "team" ? "Teams" : "Participants"}
              </h2>

              <FormField
                control={form.control}
                name="participants"
                render={() => (
                  <FormItem>
                    <FormControl>
                      {watchCategory === "team" ? (
                        <TeamSearchInput
                          placeholder="Search and add teams..."
                          onSelect={addParticipant}
                          clearAfterSelect
                        />
                      ) : (
                        <UserSearchInput
                          placeholder="Search and add participants..."
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
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {participants.map((p, idx) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-800">
                            {watchCategory === "team"
                              ? p.name
                              : p.fullName || p.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {watchCategory === "team"
                              ? `${p.players?.length || 0} players`
                              : `@${p.username}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeParticipant(p._id)}
                        className="text-red-400 hover:text-red-600 transition p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">
                    No {watchCategory === "team" ? "teams" : "participants"}{" "}
                    added yet
                  </p>
                  <p className="text-xs mt-1">Search and add at least 2</p>
                </div>
              )}

              <p className="text-xs text-gray-500 text-center">
                {participants.length} / 2 minimum{" "}
                {watchCategory === "team" ? "teams" : "participants"}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full py-6 rounded-none bg-blue-500 text-white font-semibold text-base shadow-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Tournament...
              </>
            ) : (
              "Create Tournament"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
