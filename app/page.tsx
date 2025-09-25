"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { axiosInstance } from "@/lib/axiosInstance";
import { IndividualMatch } from "@/types/match.type";

export default function HomePage() {

  return (
    <div className="flex flex-col space-y-4">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Quick Table Tennis Scoring
          </h1>
          <p className="text-lg md:text-xl mb-6">
            Track scores, manage matches, and share results instantly
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/match/create" className="btn btn-primary">
              Create a match
            </Link>
            <Link href="/teams/create" className="btn btn-secondary">
              Create a team
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      <section className="px-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Matches</h2>
          <Link href="/matches" className="text-indigo-600 hover:underline">
            See all →
          </Link>
        </div>
      </section>

      {/* Teams Section (still dummy for now) */}
      <section className="px-8 py-4 bg-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Teams</h2>
          <Link href="/teams" className="text-indigo-600 hover:underline">
            See all →
          </Link>
        </div>
      </section>
    </div>
  );
}
