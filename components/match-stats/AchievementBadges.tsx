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
        <div className="flex gap-4 pb-4">
          {achievements.map((achievement, idx) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              className="sbg-linear-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 text-4xl">
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1 text-zinc-900 dark:text-zinc-100">
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
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
