"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

export function TournamentHeaderSkeleton() {
  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#ffffff] flex flex-col gap-2 items-center justify-center">
      <Loader2 className="size-4 animate-spin" />
        <p className="text-sm text-[#353535] animate-pulse">Loading tournament...</p>
    </div>
  );
}
