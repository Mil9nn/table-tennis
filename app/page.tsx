"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function MatchPage() {

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6 text-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Tennis Match
            </h1>
            <p className="text-gray-500">Choose an option to get started</p>
          </div>

          <div className="space-y-4">
            <Link href="/match/create" className="block">
              <Button className="w-full" size="lg">
                Create New Match
              </Button>
            </Link>

            <Link href="/match/play" className="block">
              <Button variant="outline" className="w-full" size="lg">
                Continue Playing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
