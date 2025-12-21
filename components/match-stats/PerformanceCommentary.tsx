"use client";

interface PerformanceCommentaryProps {
  commentary: string[];
}

export function PerformanceCommentary({
  commentary,
}: PerformanceCommentaryProps) {
  if (!commentary || commentary.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {commentary.map((paragraph, idx) => (
        <p
          key={idx}
          className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
