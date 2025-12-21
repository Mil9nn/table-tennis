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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface QualificationConfigProps {
  form: UseFormReturn<any>;
  useGroups: boolean;
}

export function QualificationConfig({ form, useGroups }: QualificationConfigProps) {
  const watchMethod = form.watch("qualification.method");

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
        Qualification to Knockout
      </h4>

      <FormField
        control={form.control}
        name="qualification.method"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
              Method
            </FormLabel>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => field.onChange("top_n_overall")}
                className={cn(
                  "px-4 py-3 text-left rounded border transition-all",
                  field.value === "top_n_overall"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                )}
              >
                <div className="text-xs font-semibold">Top N Overall</div>
                <div className={cn(
                  "text-xs mt-0.5",
                  field.value === "top_n_overall" ? "text-slate-300" : "text-slate-500"
                )}>
                  Best performers across all participants qualify
                </div>
              </button>

              {useGroups && (
                <button
                  type="button"
                  onClick={() => field.onChange("top_n_per_group")}
                  className={cn(
                    "px-4 py-3 text-left rounded border transition-all",
                    field.value === "top_n_per_group"
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                  )}
                >
                  <div className="text-xs font-semibold">Top N Per Group</div>
                  <div className={cn(
                    "text-xs mt-0.5",
                    field.value === "top_n_per_group" ? "text-slate-300" : "text-slate-500"
                  )}>
                    Top performers from each group qualify
                  </div>
                </button>
              )}

              <button
                type="button"
                onClick={() => field.onChange("percentage")}
                className={cn(
                  "px-4 py-3 text-left rounded border transition-all",
                  field.value === "percentage"
                    ? "bg-slate-900 text-white border-slate-900 shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                )}
              >
                <div className="text-xs font-semibold">Top Percentage</div>
                <div className={cn(
                  "text-xs mt-0.5",
                  field.value === "percentage" ? "text-slate-300" : "text-slate-500"
                )}>
                  Top percentage of all participants qualify
                </div>
              </button>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchMethod === "top_n_overall" && (
        <FormField
          control={form.control}
          name="qualification.count"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                Number to Qualify
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="2"
                  className="bg-slate-50 border-slate-200 rounded h-10 text-sm
                    placeholder:text-slate-400 placeholder:opacity-70"
                  placeholder="8"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-slate-500">
                Participants advancing to knockout (should be power of 2 like 4, 8, 16...)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {watchMethod === "top_n_per_group" && (
        <FormField
          control={form.control}
          name="qualification.perGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                Qualifiers Per Group
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  className="bg-slate-50 border-slate-200 rounded h-10 text-sm
                    placeholder:text-slate-400 placeholder:opacity-70"
                  placeholder="2"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-slate-500">
                Top N from each group advance to knockout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {watchMethod === "percentage" && (
        <FormField
          control={form.control}
          name="qualification.percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                Qualifying Percentage
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  className="bg-slate-50 border-slate-200 rounded h-10 text-sm
                    placeholder:text-slate-400 placeholder:opacity-70"
                  placeholder="50"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs text-slate-500">
                Top percentage of participants who advance (1-99%)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
}

