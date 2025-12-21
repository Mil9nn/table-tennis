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

const typeStyles: Record<InsightType, { iconBg: string }> = {
  success: {
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  info: {
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  warning: {
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  highlight: {
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
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
      className={cn(
        "p-6",
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={cn("shrink-0 rounded-lg p-2", styles.iconBg)}>
          <div className="h-5 w-5 flex items-center justify-center">{icon}</div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1 text-zinc-900 dark:text-zinc-100">
            {headline}
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {description}
          </p>

          {/* Optional Metric */}
          {metric && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {metric.label}
                </span>
                <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
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
