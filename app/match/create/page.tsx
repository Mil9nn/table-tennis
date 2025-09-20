"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import IndividualMatchForm from "../componets/IndividualMatchForm";
import TeamMatchForm from "../componets/TeamMatchForm";

export default function CreateMatchPage() {
  const [matchCategory, setMatchCategory] = useState<"individual" | "team">(
    "individual"
  );

  return (
    <div className="min-h-screen p-10">
      {/* Back button */}
      <Link href="/matches">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="size-5" />
          Back to Matches
        </Button>
      </Link>

      {/* Header */}
      <div className="mt-4 space-y-2">
        <h1 className="text-2xl font-bold">Create New Match</h1>
        <p className="text-sm text-gray-600">
          Choose the category and set up your match.
        </p>
      </div>

      {/* Match Category Toggle */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Individual */}
        <Card
          onClick={() => setMatchCategory("individual")}
          className={cn(
            "cursor-pointer border-2 transition-all hover:shadow-lg",
            matchCategory === "individual"
              ? "border-blue-600 shadow-md"
              : "border-gray-200"
          )}
        >
          <CardHeader className="flex items-center justify-center py-6">
            <CardTitle
              className={cn(
                "text-lg",
                matchCategory === "individual"
                  ? "text-blue-600"
                  : "text-gray-700"
              )}
            >
              Individual Match
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Team */}
        <Card
          onClick={() => setMatchCategory("team")}
          className={cn(
            "cursor-pointer border-2 transition-all hover:shadow-lg",
            matchCategory === "team"
              ? "border-blue-600 shadow-md"
              : "border-gray-200"
          )}
        >
          <CardHeader className="flex items-center justify-center py-6">
            <CardTitle
              className={cn(
                "text-lg",
                matchCategory === "team" ? "text-blue-600" : "text-gray-700"
              )}
            >
              Team Match
            </CardTitle>
          </CardHeader>
        </Card>
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
  );
}