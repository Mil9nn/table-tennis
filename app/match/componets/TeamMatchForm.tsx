"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2, Users2, MapPin, Trophy } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import TeamSearchInput from "@/components/search/TeamSearchInput";
import CustomFormatConfig from "./CustomFormatConfig";
import PositionAssignment from "./PositionAssignment";
import { cn } from "@/lib/utils";
import {
  teamMatchCreateSchema,
  TeamMatchFormValues,
  getTeam1Positions,
  getTeam2Positions,
  teamMatchFormats,
} from "@/shared/match/teamMatchSchemas";

import WorkspacesIcon from '@mui/icons-material/Workspaces';

export default function TeamMatchForm({ endpoint }: { endpoint: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team1Data, setTeam1Data] = useState<any>(null);
  const [team2Data, setTeam2Data] = useState<any>(null);
  const [customConfig, setCustomConfig] = useState<any>(null);
  const [team1Assignments, setTeam1Assignments] = useState<Record<string, string>>({});
  const [team2Assignments, setTeam2Assignments] = useState<Record<string, string>>({});
  const router = useRouter();

  const form = useForm<TeamMatchFormValues>({
    resolver: zodResolver(teamMatchCreateSchema),
    defaultValues: {
      matchFormat: "five_singles",
      setsPerTie: "3",
      city: "",
      venue: "",
      team1Assignments: {},
      team2Assignments: {},
    },
  });

  const matchFormat = form.watch("matchFormat");
  const team1Id = form.watch("team1Id");
  const team2Id = form.watch("team2Id");

  useEffect(() => {
    if (team1Id) {
      axiosInstance.get(`/teams/${team1Id}`).then((res) => {
        const team = res.data.team;
        setTeam1Data(team);
        const assignments = team.assignments || {};
        setTeam1Assignments(assignments);
        form.setValue("team1Assignments", assignments);
      });
    }
  }, [team1Id, form]);

  useEffect(() => {
    if (team2Id) {
      axiosInstance.get(`/teams/${team2Id}`).then((res) => {
        const team = res.data.team;
        setTeam2Data(team);
        const assignments = team.assignments || {};
        setTeam2Assignments(assignments);
        form.setValue("team2Assignments", assignments);
      });
    }
  }, [team2Id, form]);

  const handleAssignmentChange = (teamNum: 1 | 2, playerId: string, position: string | null) => {
    const setter = teamNum === 1 ? setTeam1Assignments : setTeam2Assignments;
    const fieldName = teamNum === 1 ? "team1Assignments" : "team2Assignments";

    setter((prev) => {
      const next = { ...prev };
      if (position === null) delete next[playerId];
      else next[playerId] = position;
      form.setValue(fieldName, next, { shouldValidate: true });
      return next;
    });
  };

  const handleSubmit = async (data: TeamMatchFormValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        setsPerTie: Number(data.setsPerTie),
        customConfig: data.matchFormat === "custom" ? (data.customConfig || customConfig) : undefined,
      };
      const res = await axiosInstance.post(endpoint, payload);
      router.push(`/matches/${res.data.match._id}?category=team`);
      toast.success("Team Match Created");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
  <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-12">

      {/* FORMAT */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-foreground">
          Match Structure
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Match Format */}
          <FormField
            control={form.control}
            name="matchFormat"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Tie format
                </FormLabel>
                <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg">
                  {teamMatchFormats.map((format) => (
                    <button
                      key={format.value}
                      type="button"
                      onClick={() => field.onChange(format.value)}
                      className={cn(
                        "py-2 text-xs font-medium rounded-md transition-all",
                        field.value === format.value
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Sets */}
          <FormField
            control={form.control}
            name="setsPerTie"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Sets per tie
                </FormLabel>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  {["1", "3", "5", "7"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => field.onChange(n)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                        field.value === n
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* TEAMS */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-foreground">
          Competing Teams
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="team1Id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Team A
                </FormLabel>
                <FormControl>
                  <TeamSearchInput onSelect={(team) => field.onChange(team._id)} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="team2Id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Team B
                </FormLabel>
                <FormControl>
                  <TeamSearchInput onSelect={(team) => field.onChange(team._id)} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* ASSIGNMENTS */}
      {matchFormat !== "custom" && team1Data && team2Data && (
        <section className="space-y-8">
          <h3 className="text-sm font-semibold text-foreground">
            Lineup Assignment
          </h3>

          <div className="space-y-8">
            <PositionAssignment
              teamName={team1Data.name}
              players={team1Data.players || []}
              positions={getTeam1Positions(matchFormat)}
              assignments={team1Assignments}
              onAssignmentChange={(p, pos) => handleAssignmentChange(1, p, pos)}
            />

            <PositionAssignment
              teamName={team2Data.name}
              players={team2Data.players || []}
              positions={getTeam2Positions(matchFormat)}
              assignments={team2Assignments}
              onAssignmentChange={(p, pos) => handleAssignmentChange(2, p, pos)}
            />
          </div>
        </section>
      )}

      {/* CUSTOM FORMAT */}
      {matchFormat === "custom" && team1Data && team2Data && (
        <section className="space-y-6">
          <h3 className="text-sm font-semibold text-foreground">
            Custom Match Configuration
          </h3>

          <CustomFormatConfig
            team1Players={team1Data.players || []}
            team2Players={team2Data.players || []}
            team1Name={team1Data.name}
            team2Name={team2Data.name}
            onChange={(config) =>
              form.setValue("customConfig", config, { shouldValidate: true })
            }
          />
        </section>
      )}

      {/* LOCATION */}
      <section className="space-y-6">
        <h3 className="text-sm font-semibold text-foreground">
          Location
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  City
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="City" />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venue"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Venue
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Club / Arena" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </section>

      {/* CTA */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 text-sm font-medium"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Create team match"
        )}
      </Button>
    </form>
  </Form>
</div>

  );
}