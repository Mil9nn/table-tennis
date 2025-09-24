"use client";

import React from "react";
import { Users, Trophy, BarChart, Smartphone } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
        {/* Left Content */}
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

        {/* Right Visual Placeholder */}
        <div className="mt-12 md:mt-0 md:ml-12 flex justify-center">
          <div className="w-72 h-48 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg"></span>
          </div>
        </div>
      </section>

      {/* Quick Highlights */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 px-8 py-12 bg-gray-50 text-gray-800">
        <div className="flex flex-col items-center text-center">
          <Trophy className="w-8 h-8 mb-2 text-indigo-600" />
          <p className="font-medium">Custom Match Formats</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <Smartphone className="w-8 h-8 mb-2 text-indigo-600" />
          <p className="font-medium">Mobile Friendly</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <Users className="w-8 h-8 mb-2 text-indigo-600" />
          <p className="font-medium">Team & Club Support</p>
        </div>
        <div className="flex flex-col items-center text-center">
          <BarChart className="w-8 h-8 mb-2 text-indigo-600" />
          <p className="font-medium">Stats & History</p>
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Example Match Card */}
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold">Alice vs Bob</p>
            <p className="text-sm text-gray-500">Score: 11–8, 9–11, 11–7</p>
            <p className="text-xs text-gray-400 mt-1">2 days ago</p>
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold">Side 1 vs Side 2</p>
            <p className="text-sm text-gray-500">Score: 3–2</p>
            <p className="text-xs text-gray-400 mt-1">5 days ago</p>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="px-8 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Teams</h2>
          <Link href="/teams" className="text-indigo-600 hover:underline">
            See all →
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold">Smash Masters</p>
            <p className="text-sm text-gray-500">4 players</p>
          </div>
          <div className="p-4 border rounded-lg shadow-sm bg-white">
            <p className="font-semibold">Spin Kings</p>
            <p className="text-sm text-gray-500">3 players</p>
          </div>
        </div>
      </section>
    </div>
  );
}
