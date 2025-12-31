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
    <nav className="sticky top-[49px] z-20 bg-white border-b border-[#d9d9d9]">
      <div className="max-w-6xl mx-auto px-4">
        {/* Mobile: Scrollable */}
        <ScrollArea className="w-full md:hidden">
          <div className="flex gap-2 py-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => onNavigate(section.id)}
                className={cn(
                  "px-4 py-2 text-xs font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 border-b-2",
                  activeSection === section.id
                    ? "bg-[#3c6e71] text-white border-[#3c6e71]"
                    : "text-[#353535] hover:bg-[#f8f8f8] border-transparent"
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

        {/* Desktop: Grid Layout */}
        <div className="hidden md:grid grid-cols-4 gap-0">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={cn(
                "px-4 py-2 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 border-b-2",
                activeSection === section.id
                  ? "bg-[#3c6e71] text-white border-[#3c6e71]"
                  : "text-[#353535] hover:bg-[#f8f8f8] border-transparent"
              )}
            >
              {section.icon && (
                <span className="text-base">{section.icon}</span>
              )}
              <span>{section.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
