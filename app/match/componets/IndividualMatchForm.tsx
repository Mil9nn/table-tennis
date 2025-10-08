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
import { Loader2 } from "lucide-react";
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
  city: z.string().min(1, "City is required"),
  venue: z.string().optional(),
  player1: userSchema.optional(),
  player2: userSchema.optional(),
  player3: userSchema.optional(),
  player4: userSchema.optional(),
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
      player1: undefined,
      player2: undefined,
      player3: undefined,
      player4: undefined,
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      // ensure required players are selected
      if (data.matchType === "singles") {
        if (!data.player1 || !data.player2) {
          toast.error("Select both players before creating the match.");
          setIsSubmitting(false);
          return;
        }
      } else {
        if (!data.player1 || !data.player2 || !data.player3 || !data.player4) {
          toast.error("Select all four players before creating the match.");
          setIsSubmitting(false);
          return;
        }
      }

      // ✅ mixed doubles gender validation
      if (data.matchType === "mixed_doubles") {
        const teamA = [data.player1, data.player2];
        const teamB = [data.player3, data.player4];

        const validateTeam = (team: any[]) => {
          const validPlayers = team.filter(Boolean);
          if (validPlayers.length !== 2) return false;

          const genders = validPlayers.map((p) => p?.gender).filter(Boolean);
          if (genders.length < 2) return false; // some user missing gender field
          return genders.includes("male") && genders.includes("female");
        };

        const validA = validateTeam(teamA);
        const validB = validateTeam(teamB);

        if (!validA || !validB) {
          toast.error(
            "Each team in mixed doubles must have one male and one female player."
          );
          setIsSubmitting(false);
          return;
        }
      }

      // ✅ Prepare match data
      const matchData: any = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        city: data.city,
        venue: data.venue || data.city,
      };

      if (data.matchType === "singles") {
        matchData.participants = [data.player1._id, data.player2._id];
      } else {
        matchData.participants = [
          data.player1._id,
          data.player2._id,
          data.player3?._id,
          data.player4?._id,
        ];
      }

      const response = await axiosInstance.post(endpoint, matchData);
      router.push(`/matches/${response.data.match._id}?category=individual`);
      toast.success("Match created!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-8 py-4"
      >
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
              <FormMessage />
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
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Players */}
        {form.watch("matchType") === "singles" ? (
          <div className="space-y-6">
            <FormItem>
              <FormLabel>Player 1</FormLabel>
              <UserSearchInput
                placeholder="Player 1 username"
                onSelect={(u) => form.setValue("player1", u)}
              />
              <FormMessage />
            </FormItem>
            <FormItem>
              <FormLabel>Player 2</FormLabel>
              <UserSearchInput
                placeholder="Player 2 username"
                onSelect={(u) => form.setValue("player2", u)}
              />
              <FormMessage />
            </FormItem>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="rounded-xl border p-4 space-y-4">
              {form.watch("matchType") === "mixed_doubles" && (
                <p className="text-xs text-muted-foreground italic text-center">
                  Each team must have one <strong>male</strong> and one{" "}
                  <strong>female</strong> player.
                </p>
              )}
              <h3 className="text-sm font-semibold text-muted-foreground">
                Team A
              </h3>
              <FormItem>
                <FormLabel>Player A</FormLabel>
                <UserSearchInput
                  placeholder="Player A username"
                  onSelect={(u) => form.setValue("player1", u)}
                />
              </FormItem>
              <FormItem>
                <FormLabel>Partner A</FormLabel>
                <UserSearchInput
                  placeholder="Partner A username"
                  onSelect={(u) => form.setValue("player2", u)}
                />
              </FormItem>
            </div>

            <div className="rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">
                Team B
              </h3>
              <FormItem>
                <FormLabel>Player B</FormLabel>
                <UserSearchInput
                  placeholder="Player B username"
                  onSelect={(u) => form.setValue("player3", u)}
                />
              </FormItem>
              <FormItem>
                <FormLabel>Partner B</FormLabel>
                <UserSearchInput
                  placeholder="Partner B username"
                  onSelect={(u) => form.setValue("player4", u)}
                />
              </FormItem>
            </div>
          </div>
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
              <FormLabel>Venue (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter venue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Match"}
        </Button>
      </form>
    </Form>
  );
}
