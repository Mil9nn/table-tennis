"use client";

import { useEffect, useRef, useState } from "react";
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
  const mobileButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const desktopButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [mobileIndicatorStyle, setMobileIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [desktopIndicatorStyle, setDesktopIndicatorStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);

  // Update indicator position for mobile
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully laid out
    const timer = requestAnimationFrame(() => {
      const activeButton = mobileButtonRefs.current[activeSection];
      if (activeButton) {
        const container = activeButton.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();
          setMobileIndicatorStyle({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          });
        }
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [activeSection]);

  // Update indicator position for desktop
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is fully laid out
    const timer = requestAnimationFrame(() => {
      const activeButton = desktopButtonRefs.current[activeSection];
      if (activeButton) {
        const container = activeButton.parentElement;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();
          setDesktopIndicatorStyle({
            left: buttonRect.left - containerRect.left,
            width: buttonRect.width,
          });
        }
      }
    });
    return () => cancelAnimationFrame(timer);
  }, [activeSection]);

  return (
    <nav className="sticky top-[49px] z-30 border-b border-[#E6E8EB] bg-white/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4">
        {/* Mobile */}
        <ScrollArea className="md:hidden">
          <div className="relative flex gap-4 pt-3">
            {/* Sliding indicator */}
            {mobileIndicatorStyle && (
              <span
                className="absolute h-[2px] -bottom-[1px] rounded-full bg-[#3c6e71] transition-all duration-300 ease-out"
                style={{
                  left: `${mobileIndicatorStyle.left}px`,
                  width: `${mobileIndicatorStyle.width}px`,
                }}
              />
            )}

            {sections.map((section) => {
              const isActive = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  ref={(el) => {
                    mobileButtonRefs.current[section.id] = el;
                  }}
                  onClick={() => onNavigate(section.id)}
                  className={cn(
                    "relative flex items-center gap-2 pb-2 text-xs font-medium transition-colors",
                    isActive
                      ? "text-[#2B2F36]"
                      : "text-[#6B7280] hover:text-[#2B2F36]"
                  )}
                >
                  {section.icon && (
                    <span className="text-sm">{section.icon}</span>
                  )}
                  {section.label}
                </button>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        {/* Desktop */}
        <div className="relative hidden md:flex items-center gap-6 py-3">
          {/* Sliding indicator */}
          {desktopIndicatorStyle && (
            <span
              className="absolute h-[2px] -bottom-[1px] rounded-full bg-[#3c6e71] transition-all duration-300 ease-out"
              style={{
                left: `${desktopIndicatorStyle.left}px`,
                width: `${desktopIndicatorStyle.width}px`,
              }}
            />
          )}

          {sections.map((section) => {
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                ref={(el) => {
                  desktopButtonRefs.current[section.id] = el;
                }}
                onClick={() => onNavigate(section.id)}
                className={cn(
                  "relative flex items-center gap-2 pb-2 text-sm font-medium transition-colors",
                  isActive
                    ? "text-[#2B2F36]"
                    : "text-[#6B7280] hover:text-[#2B2F36]"
                )}
              >
                {section.icon && (
                  <span className="text-base">{section.icon}</span>
                )}
                {section.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
