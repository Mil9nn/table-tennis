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

// ---------------------- SCHEMA ----------------------
const userSchema = z.object({
  _id: z.string(),
  username: z.string(),
  fullName: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

const schema = z
  .object({
    matchType: z.enum(["singles", "doubles", "mixed_doubles"]),
    numberOfSets: z.enum(["1", "3", "5", "7", "9"]),
    player1: userSchema.optional(),
    player2: userSchema.optional(),
    player3: userSchema.optional(),
    player4: userSchema.optional(),
    city: z.string().min(1, "City is required"),
    venue: z.string().min(1, "Venue is required"),
  })
  .superRefine((data, ctx) => {
    // Singles: require player1 and player2
    if (data.matchType === "singles") {
      if (!data.player1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Player 1 is required for singles matches",
          path: ["player1"],
        });
      }
      if (!data.player2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Player 2 is required for singles matches",
          path: ["player2"],
        });
      }
    }

    // Doubles and Mixed Doubles: require all 4 players
    if (data.matchType === "doubles" || data.matchType === "mixed_doubles") {
      if (!data.player1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Player 1 is required",
          path: ["player1"],
        });
      }
      if (!data.player2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Player 2 is required",
          path: ["player2"],
        });
      }
      if (!data.player3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Player 3 is required",
          path: ["player3"],
        });
      }
      if (!data.player4) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Player 4 is required",
          path: ["player4"],
        });
      }
    }

    // Mixed Doubles: validate gender composition
    if (data.matchType === "mixed_doubles") {
      // Validate Team 1 (player1 and player2)
      if (data.player1 && data.player2) {
        const team1Genders = [data.player1.gender, data.player2.gender].filter(
          (g): g is "male" | "female" =>
            g === "male" || g === "female"
        );

        if (
          team1Genders.length !== 2 ||
          !team1Genders.includes("male") ||
          !team1Genders.includes("female")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Team 1 must include one male and one female player",
            path: ["player1"],
          });
        }
      }

      // Validate Team 2 (player3 and player4)
      if (data.player3 && data.player4) {
        const team2Genders = [data.player3.gender, data.player4.gender].filter(
          (g): g is "male" | "female" =>
            g === "male" || g === "female"
        );

        if (
          team2Genders.length !== 2 ||
          !team2Genders.includes("male") ||
          !team2Genders.includes("female")
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Team 2 must include one male and one female player",
            path: ["player3"],
          });
        }
      }
    }
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

  const matchType = form.watch("matchType");

  // ---------------------- SUBMIT ----------------------
  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);

    try {
      // All validation is now handled by zod schema
      const payload: any = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        city: data.city,
        venue: data.venue,
        participants:
          data.matchType === "singles"
            ? [data.player1!._id, data.player2!._id]
            : [
                data.player1!._id,
                data.player2!._id,
                data.player3!._id,
                data.player4!._id,
              ],
      };

      const res = await axiosInstance.post(endpoint, payload);

      router.push(`/matches/${res.data.match._id}?category=individual`);
      toast.success("Match created successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
          {/* ========== MATCH DETAILS ========== */}
          <section className="space-y-6">
            <div>
              <h3 className="text-base font-semibold">Match Details</h3>
              <p className="text-sm text-black/70">
                Configure match type, players, and location
              </p>
            </div>
            {/* Match Type */}
            <FormField
              control={form.control}
              name="matchType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Type</FormLabel>

                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[
                      { value: "singles", label: "Singles" },
                      { value: "doubles", label: "Doubles" },
                      { value: "mixed_doubles", label: "Mixed Doubles" },
                    ].map((opt) => {
                      const selected = field.value === opt.value;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => field.onChange(opt.value)}
                          className={`px-4 py-2 rounded-xl text-sm border transition-all
                          ${
                            selected
                              ? "bg-[#667EEA] text-white border-transparent shadow"
                              : "bg-muted text-muted-foreground hover:bg-muted/70"
                          }
                          `}
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

            {/* Number of Sets */}
            <FormField
              control={form.control}
              name="numberOfSets"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Sets</FormLabel>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {["1", "3", "5", "7", "9"].map((n) => {
                      const selected = field.value === n;
                      return (
                        <button
                          type="button"
                          key={n}
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
          </section>

          {/* ========== PLAYERS SECTION ========== */}
          <section className="space-y-2">
            <h3 className="text-base font-semibold">Participants</h3>

            {matchType === "singles" ? (
              <>
                <FormField
                  control={form.control}
                  name="player1"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <UserSearchInput
                          placeholder="Select Player 1"
                          onSelect={(u) => form.setValue("player1", u)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="player2"
                  render={() => (
                    <FormItem>
                      <FormControl>
                        <UserSearchInput
                          placeholder="Select Player 2"
                          onSelect={(u) => form.setValue("player2", u)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <>
                {matchType === "mixed_doubles" && (
                  <p className="text-sm text-muted-foreground italic">
                    Each team must have 1 male + 1 female.
                  </p>
                )}

                {/* Side A */}
                <div className="border rounded-xl p-5 bg-muted/30 space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Side A
                  </h4>
                  <FormField
                    control={form.control}
                    name="player1"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <UserSearchInput
                            placeholder="Player A"
                            onSelect={(u) => form.setValue("player1", u)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="player2"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <UserSearchInput
                            placeholder="Partner A"
                            onSelect={(u) => form.setValue("player2", u)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Side B */}
                <div className="border rounded-xl p-5 bg-muted/30 space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    Side B
                  </h4>
                  <FormField
                    control={form.control}
                    name="player3"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <UserSearchInput
                            placeholder="Player B"
                            onSelect={(u) => form.setValue("player3", u)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="player4"
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <UserSearchInput
                            placeholder="Partner B"
                            onSelect={(u) => form.setValue("player4", u)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </section>

          {/* ========== LOCATION ========== */}
          <section className="space-y-6">
            <h3 className="text-base font-semibold">Location</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </section>

          {/* BUTTON */}
          <Button
            type="submit"
            className="w-full py-6 rounded-xl bg-[#667eea] hover:bg-[#5a6fe0] text-white text-sm font-medium shadow-md"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Creating Match...
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
