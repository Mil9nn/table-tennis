"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Tab {
  value: string;
  label: string;
}

interface TabsNavProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function TabsNav({ tabs, value, onChange, className }: TabsNavProps) {
  return (
    <div
      className={cn(
        "w-full dark:bg-zinc-900 shadow-sm dark:border-zinc-800",
        className
      )}
    >
      <Tabs value={value} onValueChange={onChange}>
        <TabsList className="grid w-full bg-zinc-100 dark:bg-zinc-800" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "transition-all font-semibold text-sm text-zinc-600 dark:text-zinc-300",
                "data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700",
                "data-[state=active]:shadow-sm data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white",
                "hover:bg-zinc-200/50 dark:hover:bg-zinc-700/40"
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}