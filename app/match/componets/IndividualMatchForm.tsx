"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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

const schema = z.object({
  matchType: z.enum(["singles", "doubles", "mixed_doubles"]),
  numberOfSets: z.enum(["1", "3", "5", "7", "9"]),
  city: z.string().min(1, "City is required"),
  venue: z.string().optional(),
  player1: z.string().min(1, "Player 1 is required"),
  player2: z.string().min(1, "Player 2 is required"),
  player3: z.string().optional(),
  player4: z.string().optional(),
});

export default function IndividualMatchForm({ endpoint }: { endpoint: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      matchType: "singles",
      numberOfSets: "3",
      city: "",
      venue: "",
      player1: "",
      player2: "",
      player3: "",
      player4: "",
    },
  });

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      const matchData: any = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        city: data.city,
        venue: data.venue || data.city,
      };

      if (data.matchType === "singles") {
        matchData.participants = [data.player1, data.player2];
      } else {
        matchData.participants = [
          data.player1,
          data.player2,
          data.player3,
          data.player4,
        ];
      }

      const response = await axiosInstance.post(endpoint, matchData);
      toast.success("✅ Individual match created!");
      router.push(`/matches/${response.data.match._id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
              <FormLabel>Number of Sets (Best of)</FormLabel>
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
          <div className="grid grid-cols-2 gap-4">
            <UserSearchInput
              placeholder="Search Player 1"
              onSelect={(u) => form.setValue("player1", u._id)}
            />
            <UserSearchInput
              placeholder="Search Player 2"
              onSelect={(u) => form.setValue("player2", u._id)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <UserSearchInput
              placeholder="Player 1A"
              onSelect={(u) => form.setValue("player1", u._id)}
            />
            <UserSearchInput
              placeholder="Player 1B"
              onSelect={(u) => form.setValue("player2", u._id)}
            />
            <UserSearchInput
              placeholder="Player 2A"
              onSelect={(u) => form.setValue("player3", u._id)}
            />
            <UserSearchInput
              placeholder="Player 2B"
              onSelect={(u) => form.setValue("player4", u._id)}
            />
          </div>
        )}

        {/* City & Venue */}
        <Input placeholder="City" {...form.register("city")} />
        <Input placeholder="Venue (optional)" {...form.register("venue")} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Match"}
        </Button>
      </form>
    </Form>
  );
}