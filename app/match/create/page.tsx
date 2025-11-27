"use client";

import React, { useState } from "react";
import IndividualMatchForm from "../componets/IndividualMatchForm";
import TeamMatchForm from "../componets/TeamMatchForm";
import { motion } from "framer-motion";
import { ChevronLeft, User2, Users2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CreateMatchPage() {
  const [matchCategory, setMatchCategory] = useState<"individual" | "team">(
    "individual"
  );

  const router = useRouter();

  return (
    <div className="px-4 py-8 sm:py-12 bg-[#6C6FD5]">
      {/* Header */}
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-blue-500 bg-gray-100 transition"
        >
          <ChevronLeft className="w-5 h-5 text-[#808996]" />
        </button>
        <div className="flex flex-col items-center mx-auto gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Create New Match
          </h1>
          <p className="text-sm text-white/89">
            Select your match category and configure its details below.
          </p>
        </div>
      </header>

      {/* Match Category Toggle */}
      <div className="mt-6 py-6 max-w-2xl mx-auto bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-center flex-wrap gap-4">
          {[
            {
              type: "individual",
              title: "Individual Match",
            },
            {
              type: "team",
              title: "Team Match",
            },
          ].map((option) => {
            const isActive = matchCategory === option.type;
            return (
              <motion.div
                key={option.type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMatchCategory(option.type as any)}
                className={`${
                  isActive ? "bg-[#6C6FD5] text-white" : ""
                } rounded-xl shadow-sm cursor-pointer p-2 flex flex-col items-center justify-center gap-2 transition-all`}
              >
                <h3 className={`p-2 rounded-xl font-semibold text-sm `}>
                  {option.title}
                </h3>
              </motion.div>
            );
          })}
        </div>

        {/* Render Selected Form */}
        <motion.div
          key={matchCategory}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          {matchCategory === "individual" ? (
            <IndividualMatchForm endpoint="/matches/individual" />
          ) : (
            <TeamMatchForm endpoint="/matches/team" />
          )}
        </motion.div>
      </div>
    </div>
  );
}
