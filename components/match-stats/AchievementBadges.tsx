"use client";

import { motion } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface AchievementBadgesProps {
  achievements: Achievement[];
}

export function AchievementBadges({ achievements }: AchievementBadgesProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.25, ease: "easeOut" }}
              className="shrink-0 min-w-[180px] rounded-md bg-white px-3 py-3 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#3c6e71]/10 text-[#3c6e71] text-lg">
                  {achievement.icon}
                </div>

                {/* Content */}
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-neutral-900 leading-snug">
                    {achievement.title}
                  </h4>
                  <p className="mt-0.5 text-xs text-neutral-600 leading-relaxed line-clamp-2">
                    {achievement.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}