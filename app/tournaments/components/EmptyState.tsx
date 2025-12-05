"use client";

import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-dashed bg-white p-8 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-50">
        <Trophy className="h-7 w-7 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900">No tournaments found</h3>
      <p className="mt-1 text-sm text-zinc-600">
        {hasFilters ? "Try adjusting your search or filters." : "Create your first tournament to get started."}
      </p>
      {!hasFilters && (
        <Button asChild className="mt-4">
          <Link href="/tournaments/create">Create a tournament</Link>
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
