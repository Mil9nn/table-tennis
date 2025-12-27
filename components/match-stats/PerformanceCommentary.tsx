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
    <div className="space-y-3 bg-white">
      {commentary.map((paragraph, idx) => (
        <p
          key={idx}
          className="text-sm leading-relaxed text-[#353535]/80"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}
