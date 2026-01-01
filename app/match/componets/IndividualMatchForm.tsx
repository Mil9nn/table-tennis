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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2, Users2, MapPin } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import UserSearchInput from "./UserSearchInput";
import { cn } from "@/lib/utils";

import WorkspacesIcon from '@mui/icons-material/Workspaces';

// ---------------------- SCHEMA ----------------------
const userSchema = z.object({
  _id: z.string(),
  username: z.string(),
  fullName: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
});

const schema = z.object({
  matchType: z.enum(["singles", "doubles"]),
  numberOfSets: z.enum(["1", "3", "5", "7", "9"]),
  player1: userSchema.optional(),
  player2: userSchema.optional(),
  player3: userSchema.optional(),
  player4: userSchema.optional(),
  city: z.string().min(1, "Required"),
  venue: z.string().min(1, "Required"),
}).superRefine((data, ctx) => {
  if (data.matchType === "singles") {
    if (!data.player1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["player1"] });
    if (!data.player2) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: ["player2"] });
  } else {
    ["player1", "player2", "player3", "player4"].forEach((p) => {
      if (!data[p as keyof typeof data]) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Required", path: [p] });
    });
  }
});

export default function IndividualMatchForm({ endpoint }: { endpoint: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      matchType: "singles",
      numberOfSets: "3",
      city: "",
      venue: "",
    },
  });

  const matchType = form.watch("matchType");

  const handleSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        matchType: data.matchType,
        numberOfSets: Number(data.numberOfSets),
        city: data.city,
        venue: data.venue,
        participants: data.matchType === "singles" 
          ? [data.player1?._id, data.player2?._id]
          : [data.player1?._id, data.player2?._id, data.player3?._id, data.player4?._id],
      };
      const res = await axiosInstance.post(endpoint, payload);
      router.push(`/matches/${res.data.match._id}?category=individual`);
      toast.success("Match Created");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
  <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">

      {/* FORMAT */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Match Format
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Match Type */}
          <FormField
            control={form.control}
            name="matchType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Type
                </FormLabel>
                <div className="flex rounded-lg bg-muted p-1">
                  {["singles", "doubles"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => field.onChange(type)}
                      className={cn(
                        "flex-1 py-2 text-xs font-medium rounded-md transition-all",
                        field.value === type
                          ? "bg-background shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </FormItem>
            )}
          />

          {/* Sets */}
          <FormField
            control={form.control}
            name="numberOfSets"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">
                  Best of
                </FormLabel>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                  {["1", "3", "5", "7", "9"].map((n) => (
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

      {/* PARTICIPANTS */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Participants
        </h3>

        {matchType === "singles" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["player1", "player2"].map((p, i) => (
              <FormField
                key={p}
                control={form.control}
                name={p as any}
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Player {i + 1}
                    </FormLabel>
                    <FormControl>
                      <UserSearchInput
                        placeholder="Search player..."
                        onSelect={(u) => form.setValue(p as any, u)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { title: "Team A", players: ["player1", "player2"] },
              { title: "Team B", players: ["player3", "player4"] },
            ].map((team) => (
              <div key={team.title} className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {team.title}
                </p>
                {team.players.map((p, i) => (
                  <FormField
                    key={p}
                    control={form.control}
                    name={p as any}
                    render={() => (
                      <FormItem>
                        <FormControl>
                          <UserSearchInput
                            placeholder={`Player ${i + 1}`}
                            onSelect={(u) => form.setValue(p as any, u)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* LOCATION */}
      <section className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">
          Location
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {["city", "venue"].map((f) => (
            <FormField
              key={f}
              control={form.control}
              name={f as any}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">
                    {f === "city" ? "City" : "Venue"}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={f === "city" ? "City" : "Club / Arena"} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
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
          "Create match"
        )}
      </Button>
    </form>
  </Form>
</div>

  );
}