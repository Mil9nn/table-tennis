"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTennisStore } from "@/hooks/useTennisStore";
import MatchSetupForm from "./match/create/page";
import GameInterface from "./match/play/page";

export default function Page() {
  const { gameState } = useTennisStore();
  const [startSetup, setStartSetup] = useState(false);

  if (!startSetup) {
    return (
      <div className="p-4">
        <Button onClick={() => setStartSetup(true)}>Create a game</Button>
      </div>
    );
  }

  if (gameState === "setup") {
    return <MatchSetupForm />;
  }

  if (gameState === "playing" || gameState === "finished") {
    return <GameInterface />;
  }

  return null;
}


