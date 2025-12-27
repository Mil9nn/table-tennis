"use client";

import { useEffect } from "react";
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
  // Auto-set qualification method to top_n_per_group when groups enabled
  useEffect(() => {
    if (useGroups) {
      form.setValue("qualification.method", "top_n_per_group");
    }
  }, [useGroups, form]);

  return useGroups ? (
    <div>
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
              Number of top performers from each group to advance
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  ) : null;
}

