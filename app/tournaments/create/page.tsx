"use client";

import { useState } from "react";
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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const tournamentSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  format: z.enum(["round_robin", "knockout", "multi_stage"]),
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
  advanceTop: z.string().optional(), // For multi-stage without groups
  seedingMethod: z.enum(["manual", "none"]),
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
      advanceTop: "4", // Top N advance to knockout (for multi-stage)
      seedingMethod: "none",
    },
  });

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

    if (data.useGroups) {
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

    setIsSubmitting(true);
    try {
      const payload = {
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
        // Multi-stage format (round-robin/group stage → knockout)
        isMultiStage: data.format === "multi_stage",
        rules: {
          setsPerMatch: Number(data.setsPerMatch),
          pointsPerSet: 11,
          pointsForWin: Number(data.pointsForWin),
          // Top N advance to knockout for multi_stage format
          advanceTop:
            data.format === "multi_stage"
              ? data.useGroups
                ? 0
                : Number(data.advanceTop)
              : 0,
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        { label: "Multi Stage", value: "multi_stage" },
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

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

          {/* Groups/Pools */}
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
                      Divide tournament into multiple groups
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
                        Top N from each group advance to knockout
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Knockout stage settings for multi-stage format (when not using groups) */}
            {form.watch("format") === "multi_stage" &&
              !form.watch("useGroups") && (
                <div className="mt-4 p-4 rounded-lg border">
                  <h3 className="font-medium text-[#1A73E8] mb-2">
                    Knockout Stage Settings
                  </h3>
                  <FormField
                    control={form.control}
                    name="advanceTop"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#495057]">
                          Players advancing to knockout
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="bg-white"
                            type="number"
                            min="2"
                            max="16"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Top N players from round robin advance to knockout
                          stage (e.g., 4 for semifinals)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
          </div>

          {/* Participants */}
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-[#1A73E8] text-lg">
              Participants
            </h2>

            <UserSearchInput
              placeholder="Search and add participants"
              onSelect={addParticipant}
              clearAfterSelect
            />

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
                          {p.fullName || p.username}
                        </p>
                        <p className="text-xs text-gray-500">@{p.username}</p>
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
                No participants added yet
              </p>
            )}

            <p className="text-xs text-gray-500">
              Added: {participants.length} participants. Minimum: 2
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
