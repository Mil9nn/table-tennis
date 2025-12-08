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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface QualificationConfigProps {
  form: UseFormReturn<any>;
  useGroups: boolean;
}

export function QualificationConfig({ form, useGroups }: QualificationConfigProps) {
  const watchMethod = form.watch("qualification.method");

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">
        Qualification to Knockout
      </h4>

      <FormField
        control={form.control}
        name="qualification.method"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Method</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select qualification method" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="top_n_overall">
                  Top N Overall
                </SelectItem>
                {useGroups && (
                  <SelectItem value="top_n_per_group">
                    Top N Per Group
                  </SelectItem>
                )}
                <SelectItem value="percentage">
                  Top Percentage
                </SelectItem>
              </SelectContent>
            </Select>
            <FormDescription className="text-xs">
              {watchMethod === "top_n_overall" &&
                "Best performers across all participants qualify"}
              {watchMethod === "top_n_per_group" &&
                "Top performers from each group qualify"}
              {watchMethod === "percentage" &&
                "Top percentage of all participants qualify"}
            </FormDescription>
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
              <FormLabel>Number to Qualify</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="2"
                  className="bg-white"
                  placeholder="8"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                How many participants advance to knockout (should be power of 2: 4, 8, 16...)
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
              <FormLabel>Qualifiers Per Group</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  className="bg-white"
                  placeholder="2"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
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
              <FormLabel>Qualifying Percentage</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="1"
                  max="99"
                  className="bg-white"
                  placeholder="50"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
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

