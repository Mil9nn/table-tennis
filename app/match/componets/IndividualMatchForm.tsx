"use client";

import React, { useState } from "react";
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Users2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import UserSearchInput from "./UserSearchInput";

const userSchema = z.object({
  _id: z.string(),
  username: z.string().min(1, "Username is required"),
  fullName: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
});

const schema = z.object({
  matchType: z.enum(["singles", "doubles", "mixed_doubles"]),
  numberOfSets: z.enum(["1", "3", "5", "7", "9"]),
  player1: userSchema.optional(),
  player2: userSchema.optional(),
  player3: userSchema.optional(),
  player4: userSchema.optional(),
  city: z.string().min(1, "City is required"),
  venue: z.string().optional(),
});

export default function IndividualMatchForm({
  endpoint,
}: {
  endpoint: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      matchType: "singles",
      numberOfSets: "3",
      city: "",
      venue: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      // Player validation
      if (data.matchType === "singles" && (!data.player1 || !data.player2)) {
        toast.error("Select both players before creating the match.");
        return setIsSubmitting(false);
      }
      if (
        data.matchType !== "singles" &&
        (!data.player1 || !data.player2 || !data.player3 || !data.player4)
      ) {
        toast.error("Select all four players before creating the match.");
        return setIsSubmitting(false);
      }

      // Mixed doubles gender rule
      if (data.matchType === "mixed_doubles") {
        const validTeam = (t: any[]) => {
          const genders = t.map((p) => p?.gender).filter(Boolean);
          return genders.length === 2 && genders.includes("male") && genders.includes("female");
        };
        if (!validTeam([data.player1, data.player2]) || !validTeam([data.player3, data.player4])) {
          toast.error("Each mixed doubles team must include one male and one female player.");
          return setIsSubmitting(false);
        }
      }

      // Prepare match payload
      const matchData: any = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        city: data.city,
        venue: data.venue || data.city,
        participants:
          data.matchType === "singles"
            ? [data.player1!._id, data.player2!._id]
            : [data.player1!._id, data.player2!._id, data.player3!._id, data.player4!._id],
      };

      const res = await axiosInstance.post(endpoint, matchData);
      router.push(`/matches/${res.data.match._id}?category=individual`);
      toast.success("Match created successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create match");
    } finally {
      setIsSubmitting(false);
    }
  };

  const matchType = form.watch("matchType");

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-semibold text-lg text-foreground tracking-tight">
          Match Details
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {/* Match Type */}
          <FormField
            control={form.control}
            name="matchType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Match Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select match type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="doubles">Doubles</SelectItem>
                    <SelectItem value="mixed_doubles">Mixed Doubles</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Number of Sets */}
          <FormField
            control={form.control}
            name="numberOfSets"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Sets</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sets" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {["1", "3", "5", "7", "9"].map((n) => (
                      <SelectItem key={n} value={n}>
                        Best of {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Player Fields */}
          <div className="space-y-6">
            {matchType === "singles" ? (
              <>
                <FormItem>
                  <FormLabel>Player 1</FormLabel>
                  <UserSearchInput
                    placeholder="Search player 1"
                    onSelect={(u) => form.setValue("player1", u)}
                  />
                </FormItem>
                <FormItem>
                  <FormLabel>Player 2</FormLabel>
                  <UserSearchInput
                    placeholder="Search player 2"
                    onSelect={(u) => form.setValue("player2", u)}
                  />
                </FormItem>
              </>
            ) : (
              <>
                {matchType === "mixed_doubles" && (
                  <p className="text-xs text-muted-foreground italic text-center">
                    Each team must have one <strong>male</strong> and one{" "}
                    <strong>female</strong> player.
                  </p>
                )}

                {/* Team A */}
                <div className="border rounded-xl p-4 sm:p-5 space-y-4 bg-muted/30">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Team A
                  </h3>
                  <UserSearchInput
                    placeholder="Player A"
                    onSelect={(u) => form.setValue("player1", u)}
                  />
                  <UserSearchInput
                    placeholder="Partner A"
                    onSelect={(u) => form.setValue("player2", u)}
                  />
                </div>

                {/* Team B */}
                <div className="border rounded-xl p-4 sm:p-5 space-y-4 bg-muted/30">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Team B
                  </h3>
                  <UserSearchInput
                    placeholder="Player B"
                    onSelect={(u) => form.setValue("player3", u)}
                  />
                  <UserSearchInput
                    placeholder="Partner B"
                    onSelect={(u) => form.setValue("player4", u)}
                  />
                </div>
              </>
            )}
          </div>

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
            className="w-full text-base font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Creating...
              </>
            ) : (
              "Create Match"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}