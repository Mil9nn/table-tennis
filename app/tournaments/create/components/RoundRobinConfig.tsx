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
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
      )}

      <FormField
        control={form.control}
        name={useGroupsField}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-white p-3">
            <div className="space-y-0.5">
              <FormLabel>Use Groups</FormLabel>
              <FormDescription>
                Divide participants into separate groups/pools
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

      {watchUseGroups && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-[#6c6fd5]/30">
          <FormField
            control={form.control}
            name={numberOfGroupsField}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#495057]">Number of Groups</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="2"
                    max="8"
                    className="bg-white"
                    placeholder="4"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-xs">
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
                  <FormLabel className="text-[#495057]">Advance Per Group</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      className="bg-white"
                      placeholder="2"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
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

