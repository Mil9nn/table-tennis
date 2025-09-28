"use client";

import React, { useState } from "react";

import IndividualMatchForm from "../componets/IndividualMatchForm";
import TeamMatchForm from "../componets/TeamMatchForm";

export default function CreateMatchPage() {
  const [matchCategory, setMatchCategory] = useState<"individual" | "team">(
    "individual"
  );

  return (
    <div>
      <div className="p-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Create New Match</h1>
          <p className="text-sm text-gray-600">
            Choose the category and set up your match.
          </p>
        </div>

        {/* Match Category Toggle */}
        <div className="mt-6 grid grid-cols-2 gap-6">
          {/* Individual */}
          <div
            onClick={() => setMatchCategory("individual")}
            className={`cursor-pointer rounded-lg border-2 sm:p-4 p-2 text-center transition-all hover:shadow-lg ${
              matchCategory === "individual"
                ? "border-blue-600 shadow-md"
                : "border-gray-200"
            }`}
          >
            <h3
              className={`font-bold text-sm ${
                matchCategory === "individual"
                  ? "text-indigo-500"
                  : "text-gray-700"
              }`}
            >
              Individual Match
            </h3>
          </div>

          {/* Team */}
          <div
            onClick={() => setMatchCategory("team")}
            className={`cursor-pointer rounded-lg border-2 sm:p-4 p-2 text-center transition-all hover:shadow-lg ${
              matchCategory === "team"
                ? "border-blue-600 shadow-md"
                : "border-gray-200"
            }`}
          >
            <h3
              className={`font-bold text-sm ${
                matchCategory === "team" ? "text-indigo-500" : "text-gray-700"
              }`}
            >
              Team Match
            </h3>
          </div>
        </div>

        {/* Render Selected Form */}
        <div className="mt-8">
          {matchCategory === "individual" ? (
            <IndividualMatchForm endpoint="/matches/individual" />
          ) : (
            <TeamMatchForm endpoint="/matches/team" />
          )}
        </div>
      </div>
    </div>
  );
}
