"use client";

import { UseFormReturn } from "react-hook-form";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

interface TeamConfigProps {
  form: UseFormReturn<any>;
}

export function TeamConfig({ form }: TeamConfigProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="teamConfig.matchFormat"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Match Structure
            </FormLabel>
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  label: "5 Singles",
                  value: "five_singles",
                },
                {
                  label: "S-D-S",
                  value: "single_double_single",
                },
                {
                  label: "Custom",
                  value: "custom",
                },
              ].map((opt) => {
                const isActive = field.value === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "px-4 py-2 text-xs rounded border transition-all",
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400"
                    )}
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
            <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Sets Per Individual Match
            </FormLabel>
            <div className="flex gap-2">
              {["1", "3", "5", "7", "9"].map((n) => {
                const isActive = field.value === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => field.onChange(n)}
                    className={cn(
                      "w-10 h-10 text-sm rounded border transition-all",
                      isActive
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400"
                    )}
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

