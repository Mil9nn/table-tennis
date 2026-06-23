// components/weaknesses-analysis/RecommendationText.tsx

import React from "react";

interface RecommendationTextProps {
  text: string;
  className?: string;
}

/**
 * Component that renders recommendation text with green-colored percentages
 * Matches patterns like (45.5%) and styles them in green
 */
export function RecommendationText({ text, className = "" }: RecommendationTextProps) {
  // Match percentages in parentheses like (45.5%)
  const regex = /(\([0-9]+\.?[0-9]*%\))/g;
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the percentage pattern
        if (part.match(regex)) {
          return (
            <span key={index} className="text-green-600 font-semibold">
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
