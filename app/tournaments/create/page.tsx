// app/tournaments/create/page.tsx
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Trophy, Plus, X } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import UserSearchInput from "@/app/match/componets/UserSearchInput";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const tournamentSchema = z.object({
  name: z.string().min(3, "Tournament name must be at least 3 characters"),
  format: z.enum(["round_robin", "knockout", "swiss"]),
  category: z.enum(["individual", "team"]),
  matchType: z.enum(["singles", "doubles", "mixed_doubles"]),
  startDate: z.date({
    required_error: "Start date is required",
  }),
  city: z.string().min(2, "City is required"),
  venue: z.string().optional(),
  description: z.string().optional(),
  prizePool: z.string().optional(),
  registrationDeadline: z.date().optional(),
  setsPerMatch: z.enum(["1", "3", "5", "7"]),
  pointsForWin: z.string(),
  pointsForLoss: z.string(),
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
      description: "",
      setsPerMatch: "3",
      pointsForWin: "2",
      pointsForLoss: "0",
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

    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        participants: participants.map((p) => p._id),
        rules: {
          setsPerMatch: Number(data.setsPerMatch),
          pointsForWin: Number(data.pointsForWin),
          pointsForLoss: Number(data.pointsForLoss),
          pointsForDraw: 1,
          advanceTop: 0,
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
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Create Tournament</h1>
          <p className="text-sm text-gray-600">
            Set up a new Round Robin tournament
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Basic Information</h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tournament Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Championship 2025" {...field} />
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
                    <FormLabel>Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="round_robin">Round Robin</SelectItem>
                        <SelectItem value="knockout" disabled>
                          Knockout (Coming Soon)
                        </SelectItem>
                        <SelectItem value="swiss" disabled>
                          Swiss (Coming Soon)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="singles">Singles</SelectItem>
                        <SelectItem value="doubles">Doubles</SelectItem>
                        <SelectItem value="mixed_doubles">
                          Mixed Doubles
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell participants about this tournament..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location & Dates */}
          <div className="border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Location & Schedule</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
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
                    <FormLabel>Venue (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Community Center" {...field} />
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
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
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

              <FormField
                control={form.control}
                name="registrationDeadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Registration Deadline (Optional)</FormLabel>
                    <Popover>
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
          <div className="border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Tournament Rules</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="setsPerMatch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sets Per Match</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointsForWin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points for Win</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pointsForLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points for Loss</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="prizePool"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prize Pool (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="$1,000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Display prize information for participants
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Participants */}
          <div className="border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg">Participants</h2>

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
              Added: {participants.length} participant(s). Minimum: 2
            </p>
          </div>

          <Button
            type="submit"
            className="w-full py-6 text-base font-semibold"
            disabled={isSubmitting || participants.length < 2}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Tournament...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}