"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
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
import { CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";

// Enhanced validation schema
const matchSchema = z
  .object({
    matchCategory: z.enum(["individual", "team"]),
    matchType: z.string().min(1, "Please select match type"),
    numberOfSets: z.enum(["1", "3", "5", "7", "9"]),
    city: z.string().min(1, "Please enter city/venue"),
    venue: z.string().optional(),

    // For individual matches
    player1: z.string().optional(),
    player2: z.string().optional(),
    player3: z.string().optional(),
    player4: z.string().optional(),

    // For team matches
    team1Id: z.string().optional(),
    team2Id: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validate individual match players
      if (data.matchCategory === "individual") {
        if (data.matchType === "singles") {
          return data.player1 && data.player2;
        }
        if (data.matchType === "doubles" || data.matchType === "mixed_doubles") {
          return data.player1 && data.player2 && data.player3 && data.player4;
        }
      }

      // Validate team match
      if (data.matchCategory === "team") {
        return data.team1Id && data.team2Id && data.team1Id !== data.team2Id;
      }

      return true;
    },
    {
      message: "Please fill in all required player information",
    }
  );

export default function MatchCreationForm() {
  const [matchCategory, setMatchCategory] = useState("individual");
  const [selectedMatchType, setSelectedMatchType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team1Players, setTeam1Players] = useState(["", "", ""]);
  const [team2Players, setTeam2Players] = useState(["", "", ""]);
  const router = useRouter();

  const [teams, setTeams] = useState<any[]>([]);
  useEffect(() => {
    async function fetchTeams() {
      try {
        const res = await axiosInstance.get("/teams");
        setTeams(res.data.teams);
      } catch (err) {
        console.error("Failed to fetch teams", err);
      }
    }
    fetchTeams();
  }, []);

  const form = useForm({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      matchCategory: "individual",
      numberOfSets: "3",
      matchType: "",
      city: "",
      venue: "",
      player1: "",
      player2: "",
      player3: "",
      player4: "",
      team1Id: "",
      team2Id: "",
    },
  });

  // Individual match types
  const individualMatchTypes = [
    { value: "singles", label: "Singles 1v1" },
    { value: "doubles", label: "Doubles 2v2" },
    { value: "mixed_doubles", label: "Mixed Doubles" },
  ];

  // Team match formats
  const teamMatchFormats = [
    { value: "five_singles", label: "A,B,C,A,B vs X,Y,Z,Y,X (5 Singles)" },
    {
      value: "single_double_single",
      label: "A, AB, B vs X, XY, Y (Single-Double-Single)",
    },
    { value: "extended_format", label: "A,B,C,D,E vs 1,2,3,4,5,6 (Extended)" },
    { value: "three_singles", label: "A,B,C vs X,Y,Z (3 Singles)" },
    { value: "custom", label: "Custom Format" },
  ];

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Prepare match data according to your API structure
      const matchData = {
        matchCategory: data.matchCategory,
        matchType: data.matchType,
        numberOfSets: parseInt(data.numberOfSets),
        city: data.city,
        venue: data.venue || data.city,
      };

      // Add individual match players
      if (data.matchCategory === "individual") {
        if (data.matchType === "singles") {
          matchData.player1 = data.player1;
          matchData.player2 = data.player2;
        } else if (
          data.matchType === "doubles" ||
          data.matchType === "mixed_doubles"
        ) {
          matchData.player1 = data.player1;
          matchData.player2 = data.player2;
          matchData.player3 = data.player3;
          matchData.player4 = data.player4;
        }
      }

      // Add team match data
      if (data.matchCategory === "team") {
        matchData.team1 = data.team1Id;
        matchData.team2 = data.team2Id;
      }

      console.log("Sending match data:", matchData);

      const response = await axiosInstance.post("/matches", matchData);
      const result = await response.data;

      toast.success(result.message || "Match created successfully!");

      // Redirect to the created match
      router.push(`/matches/${result.match._id}`);
    } catch (error: any) {
      console.error("Error creating match:", error);
      toast.error(error.message || "Failed to create match");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateTeamPlayer = (team: 1 | 2, index: number, value: string) => {
    if (team === 1) {
      const newTeam1Players = [...team1Players];
      newTeam1Players[index] = value;
      setTeam1Players(newTeam1Players);
      form.setValue("team1Players", newTeam1Players);
    } else {
      const newTeam2Players = [...team2Players];
      newTeam2Players[index] = value;
      setTeam2Players(newTeam2Players);
      form.setValue("team2Players", newTeam2Players);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="p-10">
        <Link href="/matches">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="size-5" />
            Back to Matches
          </Button>
        </Link>
        <div className="space-y-6 mt-4">
          <div>
            <CardTitle className="text-2xl font-bold">
              Create New Table Tennis Match
            </CardTitle>
            <p className="text-sm text-gray-600">
              Set up a new table tennis match
            </p>
          </div>
          <section>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                {/* Match Category */}
                <FormField
                  control={form.control}
                  name="matchCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        Match Category
                      </FormLabel>
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          setMatchCategory(value);
                          setSelectedMatchType("");
                          form.setValue("matchType", "");
                        }}
                        className="flex gap-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individual" id="individual" />
                          <Label
                            htmlFor="individual"
                            className="cursor-pointer"
                          >
                            Individual
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="team" id="team" />
                          <Label htmlFor="team" className="cursor-pointer">
                            Team
                          </Label>
                        </div>
                      </RadioGroup>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Match Type */}
                <FormField
                  control={form.control}
                  name="matchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-semibold">
                        {matchCategory === "individual"
                          ? "Match Type"
                          : "Team Match Format"}
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedMatchType(value);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select match type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {matchCategory === "individual"
                            ? individualMatchTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))
                            : teamMatchFormats.map((format) => (
                                <SelectItem
                                  key={format.value}
                                  value={format.value}
                                >
                                  {format.label}
                                </SelectItem>
                              ))}
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
                      <FormLabel className="text-base font-semibold">
                        Number of Sets
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["1", "3", "5", "7", "9"].map((num) => (
                            <SelectItem key={num} value={num}>
                              {num} {num === "1" ? "Set" : "Sets"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* City/Venue */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          City *
                        </FormLabel>
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
                        <FormLabel className="text-base font-semibold">
                          Venue (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter venue name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Individual Match Players */}
                {matchCategory === "individual" && selectedMatchType && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Players</h3>

                    {/* Singles Players */}
                    {selectedMatchType === "singles" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="player1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Player 1 *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter player 1 name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="player2"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Player 2 *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter player 2 name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Doubles Players */}
                    {(selectedMatchType === "doubles" ||
                      selectedMatchType === "mixed_doubles") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Team 1 *
                          </Label>
                          <FormField
                            control={form.control}
                            name="player1"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Player 1A" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="player2"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Player 1B" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">
                            Team 2 *
                          </Label>
                          <FormField
                            control={form.control}
                            name="player3"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Player 2A" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="player4"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Player 2B" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Match Setup */}
                {matchCategory === "team" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Team Setup</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Team 1 */}
                      <FormField
                        control={form.control}
                        name="team1Id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Team 1 *
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
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

                      {/* Team 2 */}
                      <FormField
                        control={form.control}
                        name="team2Id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-base font-medium">
                              Team 2 *
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Match...
                    </>
                  ) : (
                    "Create Match"
                  )}
                </Button>
              </form>
            </Form>
          </section>
        </div>
      </div>
    </div>
  );
}
