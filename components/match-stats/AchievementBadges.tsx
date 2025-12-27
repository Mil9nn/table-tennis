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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="shrink-0 bg-white border border-[#d9d9d9] p-4 min-w-[200px]"
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 text-3xl">
                  {achievement.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm mb-1 text-[#353535]">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-[#d9d9d9] leading-relaxed">
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
