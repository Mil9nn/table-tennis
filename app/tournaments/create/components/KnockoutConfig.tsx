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
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={thirdPlaceField}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <FormLabel className="text-sm">3rd place match</FormLabel>
              <FormDescription className="text-xs">
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
          <FormItem className="flex flex-row items-center justify-between rounded-md border p-3">
            <div className="space-y-0.5">
              <FormLabel className="text-sm">Custom bracket matching</FormLabel>
              <FormDescription className="text-xs">
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

