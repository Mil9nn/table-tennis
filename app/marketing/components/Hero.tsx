"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="marketing relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-50 animate-pulse"
          style={{
            background:
              "radial-gradient(circle, rgba(60, 110, 113, 0.2), transparent)",
          }}
        />
        <div
          className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-40 animate-pulse delay-1000"
          style={{
            background:
              "radial-gradient(circle, rgba(40, 75, 99, 0.2), transparent)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-block mb-6">
            <div className="px-4 py-2 rounded-full backdrop-blur-xl bg-white/5 border border-white/10">
              <p className="text-xs sm:text-sm font-medium text-white/70">
                Built for competitive table tennis
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="font-bold text-white mb-6">
            <span>TTPro - </span>
            <span className="text-[#3c6e71]">
              For matches that matter
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-left text-md sm:text-xl text-white/70 max-w-2xl mx-auto mb-12">
            Score matches, run tournaments, and build verified player history —
            all in one platform designed for serious competition.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/register"
              className="group px-8 py-4 rounded-lg text-white font-semibold flex items-center gap-2 hover:scale-105 transition"
              style={{ backgroundColor: "#3c6e71" }}
            >
              Start Scoring Matches
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>

            <Link
              href="/matches"
              className="px-8 py-4 rounded-lg border border-white/20 text-white/80 font-semibold hover:bg-white/5 transition"
            >
              View Matches
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
