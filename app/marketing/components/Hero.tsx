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
            <div className="px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
              <p className="text-xs sm:text-sm font-medium text-gray-600">
                Built for competitive table tennis
              </p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            <span className="bg-gradient-to-r from-[#2fa4d9] to-[#4ac7f6] bg-clip-text text-transparent">TTPro</span>
            <span> - </span>
            <span className="text-gray-900">
              score matches & run tournaments
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-left text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            Build verified player history and track performance — all in one platform designed for serious competition.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/auth/register"
              className="group px-8 py-4 text-sm rounded-lg text-white font-semibold flex items-center gap-2 hover:scale-105 transition-all duration-300 hover:bg-blue-700"
              style={{ backgroundColor: "#2563eb" }}
            >
              Start Scoring Matches
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
