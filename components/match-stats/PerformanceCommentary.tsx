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
    <div className="rounded-md bg-white px-4 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <div className="space-y-2">
        {commentary.map((paragraph, idx) => (
          <p
            key={idx}
            className="text-sm leading-relaxed text-neutral-700"
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
