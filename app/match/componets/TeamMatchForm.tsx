"use client";

import React, { useEffect, useState } from "react";
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
import { Loader2 } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";

const schema = z.object({
  matchType: z.string().min(1, "Select a team format"),
  setsPerTie: z.enum(["1", "3", "5", "7"]),
  team1Id: z.string().min(1, "Select Team 1"),
  team2Id: z.string().min(1, "Select Team 2"),
  city: z.string().min(1, "Enter city/venue"),
  venue: z.string().optional(),
});

type TeamMatchFormValues = z.infer<typeof schema>;

export default function TeamMatchForm({ endpoint }: { endpoint: string }) {
  const [teams, setTeams] = useState<{ _id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<TeamMatchFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      matchType: "",
      setsPerTie: "3",
      team1Id: "",
      team2Id: "",
      city: "",
      venue: "",
    },
  });

  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await axiosInstance.get("/teams");
        setTeams(res.data.teams || []);
      } catch (err) {
        console.error("Failed to fetch teams", err);
        toast.error("Failed to load teams");
      }
    }
    fetchTeams();
  }, []);

  const teamMatchFormats = [
    { value: "five_singles", label: "Swaythling Cup [5 singles]" },
    { value: "single_double_single", label: "Single-Double-Single" },
    { value: "extended_format", label: "Extended Format" },
    { value: "three_singles", label: "3 Singles" },
    { value: "custom", label: "Custom Format" },
  ];

  const handleSubmit = async (data: TeamMatchFormValues) => {
    setIsSubmitting(true);
    try {
      if (data.team1Id === data.team2Id) {
        toast.error("❌ Team 1 and Team 2 cannot be the same");
        setIsSubmitting(false);
        return;
      }

      const matchData = {
        matchType: data.matchType,
        setsPerTie: Number(data.setsPerTie),
        city: data.city,
        venue: data.venue || data.city,
        team1Id: data.team1Id,
        team2Id: data.team2Id,
      };

      const response = await axiosInstance.post(endpoint, matchData);
      toast.success("Team match created!");
      router.push(`/matches/${response.data.match._id}?category=team`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create team match");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Match Format */}
        <FormField
          control={form.control}
          name="matchType"
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
              <FormMessage />
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
              <FormMessage />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team 1" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
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
            name="team2Id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team 2</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Team 2" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teams.map((team) => (
                      <SelectItem key={team._id} value={team._id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* City & Venue */}
        <Input placeholder="City" {...form.register("city")} />
        <Input placeholder="Venue (optional)" {...form.register("venue")} />

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Creating...
            </>
          ) : (
            "Create Team Match"
          )}
        </Button>
      </form>
    </Form>
  );
}