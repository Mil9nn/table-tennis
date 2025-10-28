"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { IndividualMatch } from "@/types/match.type";

export default function HomePage() {

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-20 overflow-hidden">
        <div className="max-w-2xl z-10">
          <h1 className="text-4xl md:text-6xl text-indigo-900/80 font-extrabold tracking-tight mb-6 drop-shadow-md">
            Table Tennis Scoring
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-700">
            Track scores, manage matches, and share results instantly with a
            sleek, modern, and intuitive interface.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/match/create"
              className="px-6 py-3 text-sm rounded-full bg-white text-indigo-700 font-semibold shadow hover:scale-105 hover:shadow-lg active:scale-95 transition-all duration-200"
            >
              Create a Match
            </Link>
            <Link
              href="/teams/create"
              className="px-6 py-3 text-sm rounded-full bg-indigo-900/80 text-white font-semibold shadow hover:bg-indigo-950 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Create a Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
