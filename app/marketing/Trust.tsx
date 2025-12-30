"use client";

import { Lock, CheckCircle, Zap, Trophy } from "lucide-react";

const TRUST = [
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Player and match data stays protected.",
  },
  {
    icon: CheckCircle,
    title: "Official Scoring Rules",
    description: "Scoring follows ITTF standards.",
  },
  {
    icon: Zap,
    title: "Reliable Under Pressure",
    description: "Fast and stable during live tournaments.",
  },
  {
    icon: Trophy,
    title: "Built for Real Events",
    description: "Used in competitive matches and leagues.",
  },
];

export default function Trust() {
  return (
    <section className="marketing py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-3 leading-tight">
          Trusted for Competitive Play
        </h2>
        <p className="text-sm sm:text-base text-white/70 max-w-xl mx-auto leading-relaxed">
          Built with real tournaments in mind.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRUST.map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <Icon className="w-6 h-6 text-white mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                {t.title}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed">{t.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
