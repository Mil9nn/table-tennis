"use client";

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface Section {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface SectionNavigationProps {
  sections: Section[];
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

export function SectionNavigation({
  sections,
  activeSection,
  onNavigate,
}: SectionNavigationProps) {
  return (
    <nav className="sticky top-[49px] z-20 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <ScrollArea className="w-full">
          <div className="flex gap-2 py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-full transition-all duration-200 whitespace-nowrap flex items-center gap-2",
                  activeSection === section.id
                    ? "bg-blue-500 text-white shadow-md"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
              >
                {section.icon && (
                  <span className="text-base">{section.icon}</span>
                )}
                {section.label}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>
      </div>
    </nav>
  );
}
