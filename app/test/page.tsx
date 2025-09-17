"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Hero / Start Match */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl font-bold">🏓 Table Tennis Scorer</h1>
          <p className="text-gray-600">Track matches, stats, and leaderboards easily.</p>
          <Link href="/match/new">
            <Button size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold">
              Start New Match
            </Button>
          </Link>
        </section>

        {/* Ongoing Matches */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Ongoing Matches</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Example match card */}
            <Card>
              <CardHeader>
                <CardTitle>Harry vs Milan</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p>Set 2 | 7–5</p>
                <Link href="/match/live">
                  <Button size="sm">Resume</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Matches */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Recent Matches</h2>
          <div className="space-y-3">
            <Card>
              <CardContent className="flex justify-between items-center py-4">
                <p>Milan def. Harry (3–1)</p>
                <span className="text-gray-500 text-sm">Yesterday</span>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex justify-between items-center py-4">
                <p>Raj def. Vivek (2–0)</p>
                <span className="text-gray-500 text-sm">2 days ago</span>
              </CardContent>
            </Card>
          </div>
          <div className="mt-3 text-right">
            <Link href="/history">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
        </section>

        {/* Leaderboard */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Leaderboard</h2>
          <div className="space-y-2">
            <div className="flex justify-between bg-white rounded-lg shadow p-3">
              <span>🏅 Milan</span>
              <span>12 Wins</span>
            </div>
            <div className="flex justify-between bg-white rounded-lg shadow p-3">
              <span>🥈 Harry</span>
              <span>9 Wins</span>
            </div>
            <div className="flex justify-between bg-white rounded-lg shadow p-3">
              <span>🥉 Raj</span>
              <span>6 Wins</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
