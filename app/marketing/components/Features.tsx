"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";

const FEATURES = [
  {
    id: 1,
    title: "Live Match Scoring",
    description:
      "Fast, referee-friendly, real-time scoring built for competitive table tennis.",
    image: "/screenshots/live-scoring.jpg",
  },
  {
    id: 2,
    title: "Tournament Management",
    description:
      "Create leagues, knockouts, and multi-stage tournaments effortlessly.",
    image: "/screenshots/tournament-management.jpg",
  },
  {
    id: 3,
    title: "Player & Team Profiles",
    description:
      "Complete match history, performance stats, and rankings in one place.",
    image: "/features/profiles.png",
  },
  {
    id: 4,
    title: "Rankings & Leaderboards",
    description:
      "Auto-updated player rankings across tournaments.",
    image: "/features/leaderboards.png",
  },
  {
    id: 5,
    title: "Performance Analytics",
    description:
      "Track form, streaks, and long-term improvement with clear insights.",
    image: "/features/analytics.png",
  },
];

export default function FeaturesCarousel() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((i) => (i + 1) % FEATURES.length);
  const prev = () =>
    setIndex((i) => (i - 1 + FEATURES.length) % FEATURES.length);

  const feature = FEATURES[index];

  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-10 px-4">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 mb-3 leading-tight">
            Built for Serious Table Tennis
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-xl mx-auto leading-relaxed">
            Everything you need to score matches, run tournaments, and track
            performance.
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation */}
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex
                       h-10 w-10 items-center justify-center rounded-full
                       border border-gray-200 bg-gray-50 text-gray-700
                       hover:bg-gray-100 transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex
                       h-10 w-10 items-center justify-center rounded-full
                       border border-gray-200 bg-gray-50 text-gray-700
                       hover:bg-gray-100 transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Feature Card */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center
                            border border-gray-200 bg-gray-50
                            "
              >
                {/* Screenshot */}
                <div
                  className="relative aspect-[16/10] overflow-hidden
                                bg-gray-100
                                flex items-center justify-center h-full"
                >
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-contain"
                    priority={index === 0}
                  />
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Progress Indicator - Clickable on all screens */}
                  <div className="mt-6 flex gap-2">
                    {FEATURES.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setIndex(i)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          i === index
                            ? "w-8 bg-gray-400"
                            : "w-3 bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
