"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MatchPage() {
  return (
    <div className="p-4">
      <div>
        <p className="text-gray-500">Choose an option to get started</p>
      </div>

      <div className="flex items-center justify-center gap-8 mt-8">
        <div className="bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6 text-center">
          <h3>Match Options</h3>
          <div className="space-y-4 flex flex-col">
            <Link href="/match/create" className="border-2 p-2">
                Create New Match
            </Link>

            <Link href="/match/play" className="border-2 p-2">
                Continue Playing
            </Link>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6 text-center">
          <h3>Team Creation</h3>
          <Link href="/teams/create" className="border-2 p-2">Create Team</Link>
        </div>

        {/* Watch live  */}
        <div className=" bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6 text-center">
          <h3>Watch Live</h3>
          <Link href="/match/live" className="border-2 p-2">Watch Live</Link>
        </div>
      </div>
    </div>
  );
}
