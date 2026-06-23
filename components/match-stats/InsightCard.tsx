"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type InsightType = "success" | "info" | "warning" | "highlight";

export interface InsightMetric {
  label: string;
  value: string | number;
}

interface InsightCardProps {
  type: InsightType;
  headline: string;
  description: string;
  metric?: InsightMetric;
  delay?: number;
}

const typeStyles: Record<
  InsightType,
  { accent: string; bar: string }
> = {
  success: { accent: "text-[#3c6e71]", bar: "bg-[#3c6e71]" },
  info: { accent: "text-[#284b63]", bar: "bg-[#284b63]" },
  warning: { accent: "text-amber-600", bar: "bg-amber-500" },
  highlight: { accent: "text-[#3c6e71]", bar: "bg-[#3c6e71]" },
};

export function InsightCard({
  type,
  headline,
  description,
  metric,
  delay = 0,
}: InsightCardProps) {
  const styles = typeStyles[type];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: "easeOut" }}
      className="
        relative overflow-hidden
        px-4 py-2
      "
    >
      <div className="flex flex-col">
        <h3 className="text-sm font-semibold text-[#2B2F36] leading-snug">
          {headline}
        </h3>

        <p className="mt-1 text-xs text-[#6B7280] leading-relaxed">
          {description}
        </p>

        {metric && (
          <div className="mt-3 flex items-end justify-between">
            <span className="text-[10px] uppercase tracking-wide text-[#9CA3AF]">
              {metric.label}
            </span>
            <span
              className={cn(
                "text-lg font-semibold tabular-nums",
                styles.accent
              )}
            >
              {metric.value}
            </span>
          </div>
        )}
      </div>
    </motion.article>
  );
}
