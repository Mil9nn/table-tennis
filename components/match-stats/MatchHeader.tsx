"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MatchHeaderProps {
  matchId: string;
  matchCategory: string;
  side1Name: string;
  side2Name: string;
}

export function MatchHeader({
  matchId,
  matchCategory,
  side1Name,
  side2Name,
}: MatchHeaderProps) {
  const router = useRouter();

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/matches/${matchId}?category=${matchCategory}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Match Stats - ${side1Name} vs ${side2Name}`,
          url: shareUrl,
        });
        toast.success("Match shared!");
      } catch (err) {
        console.error("Share failed:", err);
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    }
  };

  return (
    <div className="
      w-full flex items-center justify-between 
      p-4 
      border-b border-zinc-200 dark:border-zinc-800
    ">
      {/* LEFT: Back + Title */}
      <div className="flex items-center gap-3">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="icon"
          className="
            rounded-full 
            hover:bg-zinc-100 dark:hover:bg-zinc-800 
            transition
          "
        >
          <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
        </Button>

        <div className="flex flex-col leading-tight">
          <h3 className="text-lg font-semibold tracking-tight">
            Match Overview
          </h3>
        </div>
      </div>

      {/* RIGHT: Share */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="
          flex items-center gap-2 
          rounded-full 
          border-zinc-300 dark:border-zinc-700
        "
      >
        <Share2 className="h-4 w-4 opacity-80" />
        Share
      </Button>
    </div>
  );
}