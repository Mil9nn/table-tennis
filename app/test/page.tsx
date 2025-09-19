"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Trophy, BarChart, Smartphone } from "lucide-react";

export default function HomePage() {
  const [showAllTeams, setShowAllTeams] = useState(false);

  const teams = [
    { id: 1, name: "Smash Masters", players: 6, color: "bg-blue-500" },
    { id: 2, name: "Spin Squad", players: 5, color: "bg-red-500" },
    { id: 3, name: "Paddle Kings", players: 4, color: "bg-green-500" },
    { id: 4, name: "Loop Legends", players: 7, color: "bg-purple-500" },
  ];

  const visibleTeams = showAllTeams ? teams : teams.slice(0, 2);

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex flex-col md:flex-row items-center justify-between px-8 py-16 bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
        {/* Left Content */}
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Smart, Simple Table Tennis Scoring
          </h1>
          <p className="text-lg md:text-xl mb-6">
            Track scores, manage matches, and share results instantly – built
            for players, coaches, and clubs.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
              Start Scoring →
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-indigo-700"
            >
              + Create a Team
            </Button>
          </div>
        </div>

        {/* Right Visual Placeholder */}
        <div className="mt-12 md:mt-0 md:ml-12 flex justify-center">
          <div className="w-72 h-48 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white text-lg">📱 Scoreboard Preview</span>
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

      {/* Teams Showcase */}
      <section className="px-8 py-16 bg-white">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Build and Manage Your Teams
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {visibleTeams.map((team) => (
            <Card key={team.id} className="shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={`w-12 h-12 ${team.color} text-white rounded-full flex items-center justify-center font-bold`}
                >
                  {team.name.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-semibold">{team.name}</p>
                  <p className="text-sm text-gray-500">
                    {team.players} players
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-4">
          <Button onClick={() => setShowAllTeams(!showAllTeams)}>
            {showAllTeams ? "Show Less" : "View All Teams"}
          </Button>
          <Button variant="outline">+ Create a Team</Button>
        </div>
      </section>
    </div>
  );
}
