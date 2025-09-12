"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function MatchOverview() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Match Header */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Match Overview</CardTitle>
          <p className="text-sm text-zinc-400">
            Thursday, September 11, 2025 at 12:41 PM
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-3 items-center text-center gap-4">
          <div className="text-lg font-semibold">Mil9nn</div>
          <div className="text-2xl font-bold">VS</div>
          <div className="text-lg font-semibold">Harry</div>
        </CardContent>
      </Card>

      {/* Match Stats */}
      <Card className=" border-zinc-800">
        <CardHeader>
          <CardTitle>Match Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold">Best of 3</p>
            <p className="text-zinc-400 text-sm">Match Type</p>
          </div>
          <div>
            <p className="text-2xl font-bold">37</p>
            <p className="text-zinc-400 text-sm">Total Shots</p>
          </div>
          <div>
            <p className="text-2xl font-bold">1m 26s</p>
            <p className="text-zinc-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold">2 - 0</p>
            <p className="text-zinc-400 text-sm">Final Score</p>
          </div>
        </CardContent>
      </Card>

      {/* Game Breakdown */}
      <Card className=" border-zinc-800">
        <CardHeader>
          <CardTitle>Game Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="font-semibold">Game 1</p>
            <p className="text-zinc-400">11 - 0 | Winner: Mil9nn</p>
            <Progress value={100} className="mt-2" />
          </div>
          <Separator />
          <div>
            <p className="font-semibold">Game 2</p>
            <p className="text-zinc-400">14 - 12 | Winner: Mil9nn</p>
            <Progress value={60} className="mt-2" />
          </div>
        </CardContent>
      </Card>

      {/* Shots Summary */}
      <Card className=" border-zinc-800">
        <CardHeader>
          <CardTitle>Shots Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Mil9nn</h3>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>Forehand Drive: 8</li>
              <li>Forehand Topspin: 15</li>
              <li>Backhand Topspin: 4</li>
              <li>Smash: 2</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Harry</h3>
            <ul className="space-y-1 text-sm text-zinc-300">
              <li>Forehand Topspin: 5</li>
              <li>Backhand Topspin: 9</li>
              <li>Drop Shot: 1</li>
              <li>Smash: 0</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Timeline of Shots */}
      <Card className=" border-zinc-800">
        <CardHeader>
          <CardTitle>Shot Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300 max-h-64 overflow-y-auto">
          <p>[G1] Mil9nn - Forehand Drive (Point 1)</p>
          <p>[G1] Mil9nn - Forehand Topspin (Point 1)</p>
          <p>[G1] Mil9nn - Smash (Point 2)</p>
          <p>[G2] Harry - Backhand Topspin (Point 1)</p>
          <p>[G2] Harry - Drop Shot (Point 2)</p>
          <p>[G2] Mil9nn - Forehand Topspin (Point 3)</p>
          <p>[G2] Mil9nn - Smash (Point 4)</p>
          <p>[G2] Harry - Backhand Topspin (Point 5)</p>
          <p>[G2] Mil9nn - Smash (Point 6)</p>
        </CardContent>
      </Card>
    </div>
  );
}
