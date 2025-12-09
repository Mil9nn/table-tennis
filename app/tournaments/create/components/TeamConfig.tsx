"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

interface TeamConfigProps {
  form: UseFormReturn<any>;
}

export function TeamConfig({ form }: TeamConfigProps) {
  const watchMatchFormat = form.watch("teamConfig.matchFormat");

  return (
    <div className="space-y-4">

      <FormField
        control={form.control}
        name="teamConfig.matchFormat"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#495057]">Match Structure</FormLabel>
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  label: "5 Singles",
                  value: "five_singles",
                  desc: "Best of 5 singles matches",
                },
                {
                  label: "S-D-S",
                  value: "single_double_single",
                  desc: "Singles → Doubles → Singles",
                },
                {
                  label: "Custom",
                  value: "custom",
                  desc: "Define your own format",
                },
              ].map((opt) => {
                const isActive = field.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`px-4 py-2 text-xs rounded-lg border transition-all
                      ${
                        isActive
                          ? "bg-[#6c6fd5] text-white shadow"
                          : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
                      }`}
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

      <FormField
        control={form.control}
        name="teamConfig.setsPerSubMatch"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[#495057]">Sets Per Individual Match</FormLabel>
            <div className="flex gap-2">
              {["1", "3", "5"].map((n) => {
                const isActive = field.value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => field.onChange(n)}
                    className={`px-4 text-xs py-2 rounded-lg border transition-all
                      ${
                        isActive
                          ? "bg-[#6c6fd5] text-white shadow"
                          : "bg-white text-[#495057] border-gray-300 hover:bg-gray-100"
                      }`}
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
    </div>
  );
}

