"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";

const dummyTeams = [
  {
    _id: "1",
    name: "Spin Masters",
    city: "Delhi",
    players: 5,
    logo: "https://via.placeholder.com/100",
  },
  {
    _id: "2",
    name: "Smash Kings",
    city: "Mumbai",
    players: 4,
    logo: "https://via.placeholder.com/100",
  },
  {
    _id: "3",
    name: "Topspin Titans",
    city: "Bengaluru",
    players: 6,
    logo: "https://via.placeholder.com/100",
  },
  {
    _id: "4",
    name: "Rally Warriors",
    city: "Chandigarh",
    players: 3,
    logo: "https://via.placeholder.com/100",
  },
];

export default function TeamListings() {
  const [search, setSearch] = useState("");

  const filteredTeams = useMemo(() => {
    return dummyTeams.filter((team) =>
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.city.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-black text-white px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
        <p className="text-sm text-neutral-400">Explore and join teams</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search teams or city..."
          className="w-full bg-neutral-800/60 backdrop-blur-lg border border-neutral-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTeams.map((team, index) => (
          <motion.div
            key={team._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800 rounded-2xl p-4 flex items-center gap-4 hover:border-neutral-600 transition"
          >
            {/* Logo */}
            <img
              src={team.logo}
              alt={team.name}
              className="w-14 h-14 rounded-xl object-cover"
            />

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-base font-medium leading-tight">
                {team.name}
              </h2>
              <p className="text-xs text-neutral-400 mt-1">
                {team.city} • {team.players} players
              </p>
            </div>

            {/* CTA */}
            <button className="text-xs px-3 py-1.5 rounded-lg bg-white text-black font-medium hover:scale-105 transition">
              View
            </button>
          </motion.div>
        ))}

        {filteredTeams.length === 0 && (
          <div className="text-center text-neutral-500 text-sm mt-10">
            No teams found
          </div>
        )}
      </div>
    </div>
  );
}
