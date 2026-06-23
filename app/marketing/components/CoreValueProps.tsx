"use client";

import { motion } from "framer-motion";
import { Zap, Trophy, BarChart3 } from "lucide-react";

const VALUES = [
  {
    icon: Zap,
    title: "Real-Time Accuracy",
    description:
      "ITTF-compliant live scoring for friendly matches and competitive play.",
    color: "#2563eb",
  },
  {
    icon: Trophy,
    title: "Competition-Ready",
    description: "Built for leagues, tournaments and player rankings.",
    color: "#7c3aed",
  },
  {
    icon: BarChart3,
    title: "Meaningful Insights",
    description:
      "Detailed Stats & Performance analytics designed for serious improvement.",
    color: "#059669",
  },
];

export default function CoreValueProps() {
  return (
    <section className="marketing py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-2 leading-tight">
            Designed for leagues, tournaments and organized play.
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Match-ready table tennis workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6"
              >
                <h3 className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: v.color }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {v.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{v.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
