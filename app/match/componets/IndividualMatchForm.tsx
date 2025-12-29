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
    <div className="px-4 bg-lb-white">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* CONFIGURATION SECTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#d9d9d9] pb-2">
              <Settings2 className="w-3.5 h-3.5 text-[#3c6e71]" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535]">Individual Format</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">Format</FormLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {["singles", "doubles"].map((type) => {
                        const active = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            className={cn(
                              "py-2 text-xs font-bold uppercase rounded border-2 transition-all",
                              active
                                ? "bg-[#3c6e71] text-[#ffffff] border-[#3c6e71]"
                                : "bg-[#ffffff] text-[#353535] border-[#d9d9d9] hover:border-[#3c6e71]"
                            )}
                          >
                            {type}
                          </button>
                        );
                      })}
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numberOfSets"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">Sets (Best Of)</FormLabel>
                    <div className="flex gap-2">
                      {["1", "3", "5", "7", "9"].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => field.onChange(n)}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded border-2 transition-all",
                            field.value === n
                              ? "bg-[#3c6e71] text-[#ffffff] border-[#3c6e71]"
                              : "bg-[#ffffff] text-[#353535] border-[#d9d9d9] hover:border-[#3c6e71]"
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

          {/* PARTICIPANTS SECTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#d9d9d9] pb-2">
              <Users2 className="w-3.5 h-3.5 text-[#3c6e71]" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535]">Participants</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {matchType === "singles" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField control={form.control} name="player1" render={() => (
                    <FormItem className="space-y-1"><FormLabel className="text-xs uppercase text-[#353535] font-bold">Player 1</FormLabel><FormControl><UserSearchInput placeholder="Search..." onSelect={(u) => form.setValue("player1", u)} /></FormControl><FormMessage className="text-xs" /></FormItem>
                  )} />
                  <FormField control={form.control} name="player2" render={() => (
                    <FormItem className="space-y-1"><FormLabel className="text-xs uppercase text-[#353535] font-bold">Player 2</FormLabel><FormControl><UserSearchInput placeholder="Search..." onSelect={(u) => form.setValue("player2", u)} /></FormControl><FormMessage className="text-xs" /></FormItem>
                  )} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border border-[#d9d9d9] rounded">
                    <div className="col-span-full text-xs font-bold uppercase tracking-tighter text-[#353535]">Side A</div>
                    <FormField control={form.control} name="player1" render={() => (
                      <FormItem><FormControl><UserSearchInput placeholder="Player A1" onSelect={(u) => form.setValue("player1", u)} /></FormControl><FormMessage className="text-xs" /></FormItem>
                    )} />
                    <FormField control={form.control} name="player2" render={() => (
                      <FormItem><FormControl><UserSearchInput placeholder="Player A2" onSelect={(u) => form.setValue("player2", u)} /></FormControl><FormMessage className="text-xs" /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 border border-[#d9d9d9] rounded">
                    <div className="col-span-full text-xs font-bold uppercase tracking-tighter text-[#353535]">Side B</div>
                    <FormField control={form.control} name="player3" render={() => (
                      <FormItem><FormControl><UserSearchInput placeholder="Player B1" onSelect={(u) => form.setValue("player3", u)} /></FormControl><FormMessage className="text-xs" /></FormItem>
                    )} />
                    <FormField control={form.control} name="player4" render={() => (
                      <FormItem><FormControl><UserSearchInput placeholder="Player B2" onSelect={(u) => form.setValue("player4", u)} /></FormControl><FormMessage className="text-xs" /></FormItem>
                    )} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* VENUE SECTION */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 border-b border-[#d9d9d9] pb-2">
              <MapPin className="w-3.5 h-3.5 text-[#3c6e71]" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#353535]">Location & Venue</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">City</FormLabel>
                  <FormControl><Input className="h-10 text-sm border-[#d9d9d9] focus:border-[#3c6e71] bg-[#ffffff]" placeholder="City name" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
              <FormField control={form.control} name="venue" render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel className="text-xs font-medium text-[#353535] uppercase tracking-wide">Venue</FormLabel>
                  <FormControl><Input className="h-10 text-sm border-[#d9d9d9] focus:border-[#3c6e71] bg-[#ffffff]" placeholder="Arena/Club" {...field} /></FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )} />
            </div>
          </section>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-6 bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-[#ffffff] text-sm font-bold uppercase tracking-widest transition-all rounded shadow-md"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm & Create Match"}
          </Button>
        </form>
      </Form>
    </div>
  );
}