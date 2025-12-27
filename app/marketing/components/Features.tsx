"use client";

import { motion } from "framer-motion";
import { Zap, Trophy, Users, TrendingUp, Target, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Live Match Scoring",
    description: "Fast, referee-friendly, real-time scoring.",
    color: "#3c6e71",
  },
  {
    icon: Trophy,
    title: "Tournament Management",
    description: "Run leagues, knockouts, and multi-stage tournaments.",
    color: "#284b63",
  },
  {
    icon: Users,
    title: "Player & Team Profiles",
    description: "Match history, stats, and rankings in one place.",
    color: "#3c6e71",
  },
  {
    icon: TrendingUp,
    title: "Rankings & Leaderboards",
    description: "Automatically updated rankings across competitions.",
    color: "#284b63",
  },
  {
    icon: Target,
    title: "Flexible Match Formats",
    description: "Singles, doubles, and team matches supported.",
    color: "#3c6e71",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Track trends, streaks, and long-term improvement.",
    color: "#284b63",
  },
];

export default function Features() {
  return (
    <section className="marketing py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Everything You Need to Run Matches
          </h2>
          <p className="text-white/70 max-w-xl mx-auto">
            One platform for scoring, tournaments, and rankings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: f.color }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-white/70">{f.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
