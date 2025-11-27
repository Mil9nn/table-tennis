"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play,
  Trophy,
  Target,
  TrendingUp,
  Zap,
  BarChart3,
  Clock,
  Award,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const heading = "tracking-tight font-bold text-slate-900";
const subtext = "text-slate-600 leading-relaxed";
const sectionSpacing = "px-4 sm:px-8 py-16 sm:py-24";

const features = [
  {
    icon: Play,
    title: "Live Match Scoring",
    description: "Real-time scoring with intuitive controls and instant updates",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Target,
    title: "Shot Tracking",
    description: "Detailed shot-by-shot analysis for performance insights",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users2,
    title: "Team Matches",
    description: "Support for Swaythling and custom team formats",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Advanced Statistics",
    description: "Comprehensive stats and analytics for every match",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: Trophy,
    title: "Leaderboards",
    description: "Track rankings and compete with other players",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: Clock,
    title: "Match History",
    description: "Complete record of all your matches and performances",
    color: "from-indigo-500 to-purple-500",
  },
];

const matchTypes = [
  { type: "Singles", desc: "One-on-one matches" },
  { type: "Doubles", desc: "Paired team play" },
  { type: "Mixed Doubles", desc: "Male-female team combinations" },
  { type: "Team Matches", desc: "Multi-player team competitions" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">

      {/* HERO */}
      <section className="h-[calc(100vh-56px)] px-6 py-12 bg-gradient-to-br from-[#6C7AE0] via-[#7F88E6] to-[#8E95EC] text-white flex flex-col items-center justify-center">
        <h1 className={`text-4xl sm:text-5xl md:text-7xl font-extrabold ${heading} text-center mb-4`}>
          <span className="bg-gradient-to-r from-white via-slate-100 to-white/70 bg-clip-text text-transparent">
            Table Tennis Scoring
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-2xl text-center mb-10 leading-relaxed">
          Professional match scoring, shot tracking, and performance analytics for players & teams.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="px-8 py-5 rounded-full text-base font-semibold shadow-lg hover:shadow-xl bg-white text-[#6C7AE0] hover:bg-white/90 transition-all"
          >
            <Link href="/match/create">Create a Match</Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-8 py-5 rounded-full text-base font-semibold border-white/70 bg-[#6C7AE0] text-white hover:bg-[#5666df] transition-all"
          >
            <Link href="/teams/create">Create a Team</Link>
          </Button>
        </div>
      </section>

      {/* FEATURES */}
      <section className={sectionSpacing}>
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-6"
          >
            <h2 className={`text-3xl sm:text-4xl ${heading} mb-4`}>Features</h2>
            <p className={`text-lg ${subtext} max-w-2xl mx-auto`}>
              Powerful tools designed for players, coaches and tournament organizers.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full hover:scale-[1.02] transition-all rounded-2xl shadow-sm">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                      <p className={`${subtext}`}>{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MATCH TYPES */}
      <section className="px-4 sm:px-8 py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className={`text-2xl sm:text-3xl ${heading}`}>Supported Match Formats</h2>
            <p className={`text-sm sm:text-base ${subtext} mt-2 max-w-xl mx-auto`}>
              Professional scoring system for every table tennis format.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            {matchTypes.map((match, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl p-4 bg-white/60 backdrop-blur border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <h3 className="text-sm font-medium text-slate-900">{match.type}</h3>
                <p className="text-xs text-slate-500 mt-1">{match.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={sectionSpacing}>
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className={`text-3xl sm:text-4xl ${heading}`}>Start Scoring in 3 Simple Steps</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Create Match", desc: "Select match type & format", icon: Play },
              { step: "2", title: "Live Score", desc: "Track points and stats live", icon: Zap },
              { step: "3", title: "View Analytics", desc: "Review detailed statistics", icon: TrendingUp },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="text-center"
                >
                  <div className="relative inline-block mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-4 border-indigo-200 flex items-center justify-center font-bold text-indigo-600">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
                  <p className={subtext}>{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-8 py-16 sm:py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <Award className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className={`text-3xl sm:text-4xl ${heading} mb-4 text-white`}>Ready to Elevate Your Game?</h2>

          <p className="text-lg sm:text-xl mb-8 text-white/80">
            Everything you need to track, score, and improve your game.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="text-base px-8 py-6 rounded-full"
            >
              <Link href="/match/create">Start Your First Match</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 rounded-full bg-white/10 hover:bg-white/20 border-white/30 text-white"
            >
              <Link href="/leaderboard">View Leaderboard</Link>
            </Button>
          </div>
        </motion.div>
      </section>

    </div>
  );
}