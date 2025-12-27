"use client";

import { motion } from "framer-motion";
import { Zap, Trophy, BarChart3 } from "lucide-react";

const VALUES = [
  {
    icon: Zap,
    title: "Real-Time Accuracy",
    description: "ITTF-compliant live scoring that works in real matches.",
    color: "#3c6e71",
  },
  {
    icon: Trophy,
    title: "Competition-Ready",
    description: "Built for leagues, tournaments, and real events.",
    color: "#284b63",
  },
  {
    icon: BarChart3,
    title: "Meaningful Insights",
    description: "Match data that helps players and organizers improve.",
    color: "#3c6e71",
  },
];

export default function CoreValueProps() {
  return (
    <section className="marketing py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Built for Real Competition
          </h2>
          <p className="text-white/70 max-w-xl mx-auto">
            Designed for serious table tennis, not demos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-8"
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-6"
                  style={{ backgroundColor: v.color }}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {v.title}
                </h3>
                <p className="text-sm text-white/70">{v.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

