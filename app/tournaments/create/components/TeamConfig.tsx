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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <FormField
        control={form.control}
        name="teamConfig.matchFormat"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs text-muted-foreground">
              Tie format
            </FormLabel>
            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-lg">
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
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "py-2 text-xs font-medium rounded-md transition-all",
                      field.value === opt.value
                        ? "bg-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
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
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

