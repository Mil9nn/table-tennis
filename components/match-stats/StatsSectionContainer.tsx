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
      className="scroll-mt-32 py-8 px-4 md:px-6 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        {title && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              {icon && (
                <div className="text-[#3c6e71] flex items-center justify-center">
                  {icon}
                </div>
              )}
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-[#353535]">
                {title}
              </h2>
            </div>
            {description && (
              <p className="text-sm text-[#d9d9d9]">
                {description}
              </p>
            )}
          </div>
        )}

        {/* Section Content */}
        <div className="space-y-6">{children}</div>
      </div>
    </section>
  );
});

StatsSectionContainer.displayName = "StatsSectionContainer";
