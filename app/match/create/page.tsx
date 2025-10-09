"use client";

import React, { useState } from "react";
import IndividualMatchForm from "../componets/IndividualMatchForm";
import TeamMatchForm from "../componets/TeamMatchForm";
import { motion } from "framer-motion";
import { Users, User2, Users2 } from "lucide-react";

export default function CreateMatchPage() {
  const [matchCategory, setMatchCategory] = useState<"individual" | "team">("individual");

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
          New Match
        </h1>
        <p className="text-sm text-muted-foreground">
          Select your match category and configure its details below.
        </p>
      </div>

      {/* Match Category Toggle */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            type: "individual",
            title: "Individual Match",
            icon: <User2 className="w-6 h-6" />,
          },
          {
            type: "team",
            title: "Team Match",
            icon: <Users2 className="w-6 h-6" />,
          },
        ].map((option) => {
          const isActive = matchCategory === option.type;
          return (
            <motion.div
              key={option.type}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setMatchCategory(option.type as any)}
              className={`cursor-pointer rounded-xl border-2 p-5 flex flex-col items-center justify-center gap-2 transition-all ${
                isActive
                  ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`p-3 rounded-full ${
                  isActive
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {option.icon}
              </div>
              <h3
                className={`font-semibold text-sm ${
                  isActive ? "text-indigo-600" : "text-gray-700"
                }`}
              >
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
        className="mt-10"
      >
        {matchCategory === "individual" ? (
          <IndividualMatchForm endpoint="/matches/individual" />
        ) : (
          <TeamMatchForm endpoint="/matches/team" />
        )}
      </motion.div>
    </div>
  );
}