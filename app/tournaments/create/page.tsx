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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  Trophy,
  Plus,
  X,
  ChevronLeft,
} from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import UserSearchInput from "@/app/match/componets/UserSearchInput";
import TeamSearchInput from "@/components/search/TeamSearchInput";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const tournamentSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  format: z.enum(["round_robin", "knockout", "hybrid"]),
  category: z.enum(["individual", "team"]),
  matchType: z.enum(["singles", "doubles", "mixed_doubles"]),
  startDate: z.date({
    error: "Start date is required",
  }),
  city: z.string().min(2, "City is required"),
  venue: z.string(),
  setsPerMatch: z.enum(["1", "3", "5", "7", "9"]),
  pointsForWin: z.string(),
  useGroups: z.boolean(),
  numberOfGroups: z.string().optional(),
  advancePerGroup: z.string().optional(),
  seedingMethod: z.enum(["manual", "none"]),
  thirdPlaceMatch: z.boolean().optional(),
  allowCustomMatching: z.boolean().optional(),

  // Team tournament config
  teamMatchFormat: z.enum(["five_singles", "single_double_single", "custom"]).optional(),
  teamSetsPerSubMatch: z.string().optional(),

  // Hybrid format specific
  hybridRoundRobinUseGroups: z.boolean().optional(),
  hybridRoundRobinNumberOfGroups: z.string().optional(),
  hybridQualificationMethod: z.enum(["top_n_overall", "top_n_per_group", "percentage"]).optional(),
  hybridQualifyingCount: z.string().optional(),
  hybridQualifyingPerGroup: z.string().optional(),
  hybridQualifyingPercentage: z.string().optional(),
  hybridKnockoutThirdPlaceMatch: z.boolean().optional(),
  hybridKnockoutAllowCustomMatching: z.boolean().optional(),
});

type TournamentFormValues = z.infer<typeof tournamentSchema>;

export default function CreateTournamentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      format: "round_robin",
      category: "individual",
      matchType: "singles",
      city: "",
      venue: "",
      setsPerMatch: "3",
      pointsForWin: "2", // ITTF standard: 2 points for win
      useGroups: false,
      numberOfGroups: "4",
      advancePerGroup: "2",
      seedingMethod: "none",
      thirdPlaceMatch: false,
      allowCustomMatching: true,

      // Team tournament config defaults
      teamMatchFormat: "five_singles",
      teamSetsPerSubMatch: "3",

      // Hybrid format defaults
      hybridRoundRobinUseGroups: false,
      hybridRoundRobinNumberOfGroups: "4",
      hybridQualificationMethod: "top_n_overall",
      hybridQualifyingCount: "8",
      hybridQualifyingPerGroup: "2",
      hybridQualifyingPercentage: "50",
      hybridKnockoutThirdPlaceMatch: false,
      hybridKnockoutAllowCustomMatching: true,
    },
  });

  const watchFormat = form.watch("format");
  const watchCategory = form.watch("category");
  const watchUseGroups = form.watch("useGroups");
  const watchHybridRRUseGroups = form.watch("hybridRoundRobinUseGroups");
  const watchHybridQualMethod = form.watch("hybridQualificationMethod");

  // Reset useGroups when format changes to knockout
  useEffect(() => {
    if (watchFormat === "knockout" && watchUseGroups) {
      form.setValue("useGroups", false);
    }
  }, [watchFormat, watchUseGroups, form]);

  // Reset hybrid groups when format changes to hybrid (ensure groups are disabled by default)
  useEffect(() => {
    if (watchFormat === "hybrid" && watchHybridRRUseGroups === undefined) {
      form.setValue("hybridRoundRobinUseGroups", false);
    }
  }, [watchFormat, watchHybridRRUseGroups, form]);

  // Reset qualification method if "top_n_per_group" is selected but groups are disabled
  useEffect(() => {
    if (watchFormat === "hybrid" && !watchHybridRRUseGroups && watchHybridQualMethod === "top_n_per_group") {
      form.setValue("hybridQualificationMethod", "top_n_overall");
    }
  }, [watchFormat, watchHybridRRUseGroups, watchHybridQualMethod, form]);

  const addParticipant = (user: any) => {
    if (!participants.find((p) => p._id === user._id)) {
      setParticipants([...participants, user]);
    }
  };

  const removeParticipant = (userId: string) => {
    setParticipants(participants.filter((p) => p._id !== userId));
  };

  const onSubmit = async (data: TournamentFormValues) => {
    if (participants.length < 2) {
      toast.error("Add at least 2 participants");
      return;
    }

    // Validate groups for round-robin format
    if (data.format === "round_robin" && data.useGroups) {
      const numGroups = Number(data.numberOfGroups || 0);
      if (numGroups < 2) {
        toast.error("At least 2 groups required when using groups");
        return;
      }
      if (participants.length < numGroups) {
        toast.error(
          `Need at least ${numGroups} participants for ${numGroups} groups`
        );
        return;
      }
    }

    // Validate groups for hybrid format (round-robin phase)
    if (data.format === "hybrid" && data.hybridRoundRobinUseGroups === true) {
      const numGroups = Number(data.hybridRoundRobinNumberOfGroups || 0);
      if (numGroups < 2) {
        toast.error("At least 2 groups required for round-robin phase");
        return;
      }
      if (participants.length < numGroups) {
        toast.error(
          `Need at least ${numGroups} participants for ${numGroups} groups in round-robin phase`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: data.name,
        format: data.format,
        category: data.category,
        matchType: data.matchType,
        startDate: data.startDate,
        city: data.city,
        venue: data.venue,
        participants: participants.map((p) => p._id),
        useGroups: data.useGroups,
        numberOfGroups: data.useGroups
          ? Number(data.numberOfGroups)
          : undefined,
        advancePerGroup: data.useGroups
          ? Number(data.advancePerGroup)
          : undefined,
        seedingMethod: data.seedingMethod,
        knockoutConfig: data.format === "knockout" ? {
          allowCustomMatching: data.allowCustomMatching ?? true,
          autoGenerateBracket: true,
          thirdPlaceMatch: data.thirdPlaceMatch ?? false,
          consolationBracket: false,
        } : undefined,
        rules: {
          setsPerMatch: Number(data.setsPerMatch),
          pointsPerSet: 11,
          pointsForWin: Number(data.pointsForWin),
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

      // Add team configuration if category is team
      if (data.category === "team") {
        payload.teamConfig = {
          matchFormat: data.teamMatchFormat || "five_singles",
          setsPerSubMatch: Number(data.teamSetsPerSubMatch) || 3,
        };
      }

      // Add hybrid configuration if format is hybrid
      if (data.format === "hybrid") {
        payload.hybridConfig = {
          roundRobinUseGroups: data.hybridRoundRobinUseGroups ?? false,
          roundRobinNumberOfGroups: data.hybridRoundRobinUseGroups
            ? Number(data.hybridRoundRobinNumberOfGroups)
            : undefined,
          qualificationMethod: data.hybridQualificationMethod || "top_n_overall",
          qualifyingCount:
            data.hybridQualificationMethod === "top_n_overall"
              ? Number(data.hybridQualifyingCount)
              : undefined,
          qualifyingPerGroup:
            data.hybridQualificationMethod === "top_n_per_group"
              ? Number(data.hybridQualifyingPerGroup)
              : undefined,
          qualifyingPercentage:
            data.hybridQualificationMethod === "percentage"
              ? Number(data.hybridQualifyingPercentage)
              : undefined,
          knockoutAllowCustomMatching:
            data.hybridKnockoutAllowCustomMatching ?? false,
          knockoutThirdPlaceMatch:
            data.hybridKnockoutThirdPlaceMatch ?? false,
        };
      }

      console.log("Tournament payload:", JSON.stringify(payload, null, 2));

      const response = await axiosInstance.post("/tournaments", payload);
      toast.success("Tournament created successfully!");
      router.push(`/tournaments/${response.data.tournament._id}`);
    } catch (err: any) {
      console.error("Error creating tournament:", err);
      toast.error(err.response?.data?.error || "Failed to create tournament");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#6c6fd5] p-2">
      <header className="flex items-center gap-2 p-4 text-white">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-blue-500 bg-gray-100 transition"
        >
          <ChevronLeft className="w-5 h-5 text-[#808996]" />
        </button>
        <div className="mx-auto">
          <h1 className="text-3xl font-bold">Create Tournament</h1>
          <p className="text-sm text-gray-300">
            Fill in the details to setup your tournament
          </p>
        </div>
      </header>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-4 max-w-2xl mx-auto bg-white rounded-xl"
        >
          {/* Basic Info */}
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-[#1A73E8] text-lg">
              Basic Information
            </h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#495057]">
                    Tournament Name
                  </FormLabel>
                  <FormControl>
                    <Input className="bg-[#F8F9FA]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="format"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#495057]">Format</FormLabel>

                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "Round Robin", value: "round_robin" },
                        { label: "Knockout", value: "knockout" },
                        { label: "Hybrid (RR → KO)", value: "hybrid" },
                      ].map((opt) => {
                        const isActive = field.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`px-4 py-2 text-xs rounded-lg border transition-all
                              ${
                                isActive
                                  ? "bg-[#6c6fd5] text-white shadow"
                                  : "bg-[#F8F9FA] text-[#495057] border-gray-300 hover:bg-gray-100"
                              }`}
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#495057]">Category</FormLabel>

                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "Individual", value: "individual" },
                        { label: "Team", value: "team" },
                      ].map((opt) => {
                        const isActive = field.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`px-4 py-2 text-xs rounded-lg border transition-all
                            ${
                              isActive
                                ? "bg-[#6c6fd5] text-white shadow"
                                : "bg-[#F8F9FA] text-[#495057] border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <FormDescription className="text-xs">
                      Individual: players compete alone or in pairs
                      <br />
                      Team: teams compete against each other
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#495057]">Match Type</FormLabel>

                    <div className="flex gap-2 flex-wrap">
                      {[
                        { label: "Singles", value: "singles" },
                        { label: "Doubles", value: "doubles" },
                        { label: "Mixed Doubles", value: "mixed_doubles" },
                      ].map((opt) => {
                        const isActive = field.value === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`px-4 py-2 text-xs rounded-lg border transition-all
                            ${
                              isActive
                                ? "bg-[#6c6fd5] text-white shadow"
                                : "bg-[#F8F9FA] text-[#495057] border-gray-300 hover:bg-gray-100"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>

                    <FormDescription className="text-xs">
                      {form.watch("category") === "team" 
                        ? "Team match format (applies to submatches)"
                        : "Individual match format"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Team Tournament Config */}
            {watchCategory === "team" && (
              <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                <h3 className="font-semibold text-[#6c6fd5]">
                  Team Match Configuration
                  <p className="text-xs font-normal text-gray-500">Configure how team vs team matches work</p>
                </h3>

                <FormField
                  control={form.control}
                  name="teamMatchFormat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#495057]">Match Format</FormLabel>
                      <div className="flex gap-2 flex-wrap">
                        {[
                          { label: "5 Singles", value: "five_singles", desc: "5 singles matches, first to win 3" },
                          { label: "S-D-S", value: "single_double_single", desc: "Singles, Doubles, Singles format" },
                          { label: "Custom", value: "custom", desc: "Define your own format" },
                        ].map((opt) => {
                          const isActive = field.value === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => field.onChange(opt.value)}
                              className={`px-4 py-2 text-xs rounded-lg border transition-all
                                ${
                                  isActive
                                    ? "bg-[#6c6fd5] text-white shadow"
                                    : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                      <FormDescription className="text-xs">
                        {field.value === "five_singles" && "Teams play 5 singles matches, first to win 3 overall wins"}
                        {field.value === "single_double_single" && "Singles → Doubles → Singles format (common in leagues)"}
                        {field.value === "custom" && "Define custom submatch format (coming soon)"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="teamSetsPerSubMatch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#495057]">Sets Per Submatch</FormLabel>
                      <div className="flex gap-2">
                        {["1", "3", "5"].map((n) => {
                          const isActive = field.value === n;
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => field.onChange(n)}
                              className={`px-4 text-xs py-2 rounded-lg border transition-all
                                ${
                                  isActive
                                    ? "bg-[#6c6fd5] text-white shadow"
                                    : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                              Best of {n}
                            </button>
                          );
                        })}
                      </div>
                      <FormDescription className="text-xs">
                        Number of sets for each individual submatch within the team match
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Knockout Options */}
            {watchFormat === "knockout" && (
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold">Knockout Options</h3>

                <FormField
                  control={form.control}
                  name="thirdPlaceMatch"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>3rd Place Match</FormLabel>
                        <FormDescription>
                          Include a match between semi-final losers to determine 3rd place
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowCustomMatching"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Allow Custom Matching</FormLabel>
                        <FormDescription>
                          Allow organizer to manually set bracket matchups at each round
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Hybrid Format Options */}
            {watchFormat === "hybrid" && (
              <div className="space-y-4 rounded-lg border p-4 bg-gradient-to-br from-blue-50 to-purple-50">
                <h3 className="font-semibold text-[#6c6fd5]">
                  Hybrid Format Configuration
                  <p className="text-xs font-normal text-gray-500">(Round-Robin → Knockout)</p>
                </h3>

                {/* Round-Robin Phase Settings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Round-Robin Phase</h4>

                  <FormField
                    control={form.control}
                    name="hybridRoundRobinUseGroups"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Use Groups</FormLabel>
                          <FormDescription>
                            Divide participants into groups for round-robin
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {watchHybridRRUseGroups && (
                    <FormField
                      control={form.control}
                      name="hybridRoundRobinNumberOfGroups"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Groups</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="2"
                              max="8"
                              className="bg-white"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            How many groups to create (2-8)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Qualification Settings - Always shown for hybrid tournaments */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Qualification</h4>

                  <FormField
                    control={form.control}
                    name="hybridQualificationMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualification Method</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select qualification method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="top_n_overall">
                              Top N Overall
                            </SelectItem>
                            {watchHybridRRUseGroups && (
                              <SelectItem value="top_n_per_group">
                                Top N Per Group
                              </SelectItem>
                            )}
                            <SelectItem value="percentage">
                              Percentage
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {watchHybridQualMethod === "top_n_overall" &&
                            "Best performers across all participants"}
                          {watchHybridQualMethod === "top_n_per_group" &&
                            "Top performers from each group"}
                          {watchHybridQualMethod === "percentage" &&
                            "Top percentage of all participants"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                    {watchHybridQualMethod === "top_n_overall" && (
                      <FormField
                        control={form.control}
                        name="hybridQualifyingCount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Number to Qualify</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="2"
                                className="bg-white"
                                placeholder="8"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              How many participants advance to knockout
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchHybridQualMethod === "top_n_per_group" && (
                      <FormField
                        control={form.control}
                        name="hybridQualifyingPerGroup"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualifiers Per Group</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                className="bg-white"
                                placeholder="2"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Top N from each group advance
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchHybridQualMethod === "percentage" && (
                      <FormField
                        control={form.control}
                        name="hybridQualifyingPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualifying Percentage</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max="99"
                                className="bg-white"
                                placeholder="50"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Percentage of participants who advance (1-99%)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                {/* Knockout Phase Settings */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Knockout Phase</h4>

                  <FormField
                    control={form.control}
                    name="hybridKnockoutThirdPlaceMatch"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
                        <div className="space-y-0.5">
                          <FormLabel>3rd Place Match</FormLabel>
                          <FormDescription>
                            Include 3rd place playoff in knockout phase
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hybridKnockoutAllowCustomMatching"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Allow Custom Matching</FormLabel>
                          <FormDescription>
                            Manually set bracket matchups in knockout
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Dates */}
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-[#1A73E8] text-lg">
              Location & Schedule
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#495057]">City</FormLabel>
                    <FormControl>
                      <Input
                        className="bg-[#F8F9FA]"
                        placeholder="New York"
                        {...field}
                      />
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
                    <FormLabel className="text-[#495057]">
                      Venue
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="bg-[#F8F9FA]"
                        placeholder="Community Center"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-[#495057]">Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal bg-[#F8F9FA]",
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
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Rules */}
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-[#1A73E8] text-lg">
              Tournament Rules
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="setsPerMatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#495057]">
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
                            className={`px-4 text-xs py-2 rounded-lg border transition-all
                            ${
                              isActive
                                ? "bg-[#6c6fd5] text-white shadow"
                                : "bg-[#F8F9FA] text-[#495057] border-gray-300 hover:bg-gray-100"
                            }`}
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
          </div>

          {/* Groups/Pools - Only for Round Robin */}
          {watchFormat === "round_robin" && (
            <div className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="useGroups"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="font-semibold text-[#1A73E8] text-lg">
                        Use Groups/Pools
                      </FormLabel>
                      <FormDescription>
                        Divide participants into multiple groups
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

            {form.watch("useGroups") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfGroups"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#495057]">
                        Number of Groups
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-[#F8F9FA]"
                          type="number"
                          min="2"
                          max="8"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        2-8 groups (Groups will be named A, B, C...)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="advancePerGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#495057]">
                        Qualifiers per group
                      </FormLabel>
                      <FormControl>
                        <Input
                          className="bg-[#F8F9FA]"
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Top N from each group advance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            </div>
          )}

          {/* Participants */}
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-[#1A73E8] text-lg">
              {watchCategory === "team" ? "Teams" : "Participants"}
            </h2>

            {watchCategory === "team" ? (
              <TeamSearchInput
                placeholder="Search and add teams"
                onSelect={addParticipant}
                clearAfterSelect
              />
            ) : (
              <UserSearchInput
                placeholder="Search and add participants"
                onSelect={addParticipant}
                clearAfterSelect
              />
            )}

            {participants.length > 0 ? (
              <div className="space-y-2">
                {participants.map((p, idx) => (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {watchCategory === "team" 
                            ? p.name 
                            : (p.fullName || p.username)}
                        </p>
                        {watchCategory === "team" ? (
                          <p className="text-xs text-gray-500">
                            {p.players?.length || 0} players
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">@{p.username}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeParticipant(p._id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No {watchCategory === "team" ? "teams" : "participants"} added yet
              </p>
            )}

            <p className="text-xs text-gray-500">
              Added: {participants.length} {watchCategory === "team" ? "teams" : "participants"}. Minimum: 2
            </p>
          </div>

          <Button
            type="submit"
            className="w-full py-6 rounded-xl bg-[#667eea] hover:bg-[#5a6fe0] text-white text-sm font-medium shadow-md"
            disabled={isSubmitting || participants.length < 2}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Tournament...
              </>
            ) : (
              <>Create Tournament</>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
