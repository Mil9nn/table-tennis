"use client";

import React, { forwardRef } from "react";

interface StatsSectionContainerProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const StatsSectionContainer = forwardRef<
  HTMLElement,
  StatsSectionContainerProps
>(({ id, title, description, icon, children }, ref) => {
  return (
    <section
      id={id}
      ref={ref}
      className="scroll-mt-32 py-12 px-4 md:px-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="text-blue-500 flex items-center justify-center">
                {icon}
              </div>
            )}
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>

        {/* Section Content */}
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
});

StatsSectionContainer.displayName = "StatsSectionContainer";
