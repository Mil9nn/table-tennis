"use client";

import React, { useState } from "react";
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
import { Loader2, Users2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import TeamSearchInput from "@/components/search/TeamSearchInput";

const schema = z.object({
  matchFormat: z.string().min(1, "Select a team format"),
  setsPerTie: z.enum(["1", "3", "5", "7"]),
  team1Id: z.string().min(1, "Select Team 1"),
  team2Id: z.string().min(1, "Select Team 2"),
  city: z.string().min(1, "Enter city/venue"),
  venue: z.string().optional(),
});

type TeamMatchFormValues = z.infer<typeof schema>;

export default function TeamMatchForm({ endpoint }: { endpoint: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    },
  });

  const teamMatchFormats = [
    { value: "five_singles", label: "Swaythling Format [5 singles]" },
    { value: "single_double_single", label: "Single–Double–Single" },
    { value: "extended_format", label: "Extended Format" },
    { value: "three_singles", label: "3 Singles" },
    { value: "custom", label: "Custom Format" },
  ];

  const handleSubmit = async (data: TeamMatchFormValues) => {
    setIsSubmitting(true);
    try {
      if (data.team1Id === data.team2Id) {
        toast.error("Team 1 and Team 2 cannot be the same.");
        return setIsSubmitting(false);
      }

      const matchData = {
        matchFormat: data.matchFormat,
        setsPerTie: Number(data.setsPerTie),
        city: data.city,
        venue: data.venue || data.city,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
      };

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
    <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <h2 className="font-semibold text-lg text-foreground tracking-tight">
          Team Match Setup
        </h2>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
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
              </FormItem>
            )}
          />

          {/* Sets Per Tie */}
          <FormField
            control={form.control}
            name="setsPerTie"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sets Per Tie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sets per tie" />
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
              "Create Team Match"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}