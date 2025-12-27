"use client";

import { Users, BarChart3, Clipboard, Building2 } from "lucide-react";

const ROLES = [
  {
    icon: Users,
    role: "Player",
    description: "Track matches, stats, and rankings automatically.",
  },
  {
    icon: BarChart3,
    role: "Coach",
    description: "Analyze player performance across matches.",
  },
  {
    icon: Clipboard,
    role: "Organizer",
    description: "Create and manage tournaments easily.",
  },
  {
    icon: Building2,
    role: "Association",
    description: "Operate leagues, seasons, and rankings at scale.",
  },
];

export default function RoleBasedHowItWorks() {
  return (
    <section className="marketing py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
          Built for Everyone in the Game
        </h2>
        <p className="text-white/70 max-w-xl mx-auto">
          One platform that adapts to every role.
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {ROLES.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.role}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <Icon className="w-6 h-6 text-white mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {r.role}
              </h3>
              <p className="text-sm text-white/70">{r.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
