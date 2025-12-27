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
  icon: React.ReactNode;
  headline: string;
  description: string;
  metric?: InsightMetric;
  delay?: number;
}

// Accent colors using app palette with variety
const typeStyles: Record<InsightType, { iconBg: string; accent: string }> = {
  success: {
    iconBg: "bg-[#3c6e71]/10",
    accent: "text-[#3c6e71]",
  },
  info: {
    iconBg: "bg-[#284b63]/10",
    accent: "text-[#284b63]",
  },
  warning: {
    iconBg: "bg-amber-500/10",
    accent: "text-amber-600",
  },
  highlight: {
    iconBg: "bg-[#3c6e71]/10",
    accent: "text-[#3c6e71]",
  },
};

export function InsightCard({
  type,
  icon,
  headline,
  description,
  metric,
  delay = 0,
}: InsightCardProps) {
  const styles = typeStyles[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="p-4 bg-white border-b border-[#d9d9d9]"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("shrink-0 p-2", styles.iconBg, styles.accent)}>
          <div className="h-5 w-5 flex items-center justify-center">{icon}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 text-[#353535]">
            {headline}
          </h3>
          <p className="text-xs text-[#353535]/70 leading-relaxed">
            {description}
          </p>

          {/* Optional Metric */}
          {metric && (
            <div className="mt-3 pt-3 border-t border-[#d9d9d9]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#d9d9d9]">
                  {metric.label}
                </span>
                <span className={cn("text-lg font-bold", styles.accent)}>
                  {metric.value}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
