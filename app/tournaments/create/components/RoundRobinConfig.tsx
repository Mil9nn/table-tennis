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
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface RoundRobinConfigProps {
  form: UseFormReturn<any>;
  prefix?: string; // For hybrid: "hybridRoundRobin", for regular: ""
  title?: string;
  showAdvancePerGroup?: boolean;
}

export function RoundRobinConfig({
  form,
  prefix = "",
  title = "Groups/Pools",
  showAdvancePerGroup = true,
}: RoundRobinConfigProps) {
  const useGroupsField = prefix ? `${prefix}.useGroups` : "useGroups";
  const numberOfGroupsField = prefix ? `${prefix}.numberOfGroups` : "numberOfGroups";
  const advancePerGroupField = prefix ? `${prefix}.advancePerGroup` : "advancePerGroup";

  const watchUseGroups = form.watch(useGroupsField);

  return (
    <div className="space-y-4">
      {title && (
        <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">{title}</h4>
      )}

      <FormField
        control={form.control}
        name={useGroupsField}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded border border-slate-200 bg-white p-3">
            <div className="space-y-0.5">
              <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">Use Groups</FormLabel>
              <FormDescription className="text-xs text-slate-500">
                Divide participants into separate groups/pools
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {watchUseGroups && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-slate-200">
          <FormField
            control={form.control}
            name={numberOfGroupsField}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">Number of Groups</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2"
                    max="8"
                    className="bg-slate-50 border-slate-200 rounded h-10 text-sm placeholder:text-slate-400 placeholder:opacity-70"
                    placeholder="4"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs text-slate-500">
                  Groups will be named A, B, C...
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {showAdvancePerGroup && (
            <FormField
              control={form.control}
              name={advancePerGroupField}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">Advance Per Group</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      className="bg-slate-50 border-slate-200 rounded h-10 text-sm placeholder:text-slate-400 placeholder:opacity-70"
                      placeholder="2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-slate-500">
                    Top N from each group advance
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

