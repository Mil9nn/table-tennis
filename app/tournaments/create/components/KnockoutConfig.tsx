"use client";

import { UseFormReturn } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

interface KnockoutConfigProps {
  form: UseFormReturn<any>;
  prefix?: string; // For hybrid: "hybridKnockout", for regular: "knockout"
  title?: string;
}

export function KnockoutConfig({
  form,
  prefix = "knockout",
  title,
}: KnockoutConfigProps) {
  const thirdPlaceField = `${prefix}.thirdPlaceMatch`;
  const customMatchingField = `${prefix}.allowCustomMatching`;

  return (
    <div className="space-y-3">
      {title && (
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      )}

      <FormField
        control={form.control}
        name={thirdPlaceField}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
            <div className="space-y-0.5">
              <FormLabel>3rd Place Match</FormLabel>
              <FormDescription>
                Include a match between semi-final losers
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={customMatchingField}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
            <div className="space-y-0.5">
              <FormLabel>Custom Bracket Matching</FormLabel>
              <FormDescription>
                Manually set matchups at each round
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

