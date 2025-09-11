"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  User,
  Search,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTennisStore } from "@/hooks/useTennisStore";

export default function CreateMatchPage() {
  const router = useRouter();
  const { players, addPlayer, removePlayer, setBestOf, bestOf, startNewMatch } =
    useTennisStore();

  // keep local inputs for both players
  const [usernames, setUsernames] = useState<{ p1: string; p2: string }>({
    p1: "",
    p2: "",
  });
  const [searching, setSearching] = useState<{ p1: boolean; p2: boolean }>({
    p1: false,
    p2: false,
  });
  const [errors, setErrors] = useState<{ p1: string; p2: string }>({
    p1: "",
    p2: "",
  });

  const matchPlayers = Object.keys(players);

  const searchUser = async (username: string, slot: "p1" | "p2") => {
    if (!username.trim()) {
      setErrors((prev) => ({ ...prev, [slot]: "" }));
      return;
    }

    setSearching((prev) => ({ ...prev, [slot]: true }));
    try {
      const res = await fetch(
        `/api/users/search?username=${encodeURIComponent(username)}`
      );
      const data = await res.json();

      if (data.success && data.user) {
        addPlayer({
          userId: data.user._id,
          username: data.user.username,
          displayName: data.user.displayName,
          currentScore: 0,
          gamesWon: 0,
          serving: slot === "p1", // first player serves
          shots: [],
        });
        setErrors((prev) => ({ ...prev, [slot]: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          [slot]:
            "User not found. Please check username or ask them to register.",
        }));
        if (slot === "p1" && matchPlayers[0]) removePlayer(matchPlayers[0]);
        if (slot === "p2" && matchPlayers[1]) removePlayer(matchPlayers[1]);
      }
    } catch (err) {
      console.error("User search error:", err);
      setErrors((prev) => ({
        ...prev,
        [slot]: "Error searching for user. Please try again.",
      }));
    } finally {
      setSearching((prev) => ({ ...prev, [slot]: false }));
    }
  };

  // debounce search for player 1
  useEffect(() => {
    const t = setTimeout(() => {
      if (usernames.p1) searchUser(usernames.p1, "p1");
    }, 500);
    return () => clearTimeout(t);
  }, [usernames.p1]);

  // debounce search for player 2
  useEffect(() => {
    const t = setTimeout(() => {
      if (usernames.p2) searchUser(usernames.p2, "p2");
    }, 500);
    return () => clearTimeout(t);
  }, [usernames.p2]);

  const handleStartMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchPlayers.length === 2) {
      startNewMatch();
      router.push("/match/play");
    }
  };

  const renderPlayerInput = (slot: "p1" | "p2", placeholder: string) => {
    const player = matchPlayers[slot === "p1" ? 0 : 1]
      ? players[matchPlayers[slot === "p1" ? 0 : 1]]
      : null;

    return (
      <div>
        <div className="relative">
          <Input
            placeholder={placeholder}
            value={usernames[slot]}
            onChange={(e) =>
              setUsernames((prev) => ({ ...prev, [slot]: e.target.value }))
            }
            className={
              errors[slot]
                ? "border-red-300"
                : player
                ? "border-green-300"
                : ""
            }
          />
          <div className="absolute right-3 top-3">
            {searching[slot] && <Search className="w-4 h-4 animate-bounce" />}
            {!searching[slot] && player && (
              <Check className="w-4 h-4 text-green-500" />
            )}
            {!searching[slot] && errors[slot] && (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
          </div>
        </div>
        {player && (
          <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            <div className="text-sm">
              <div className="font-medium">{player.displayName}</div>
            </div>
          </div>
        )}
        {errors[slot] && (
          <Alert className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {errors[slot]}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6">
          <div className="flex items-center mb-4">
            <Link href="/match">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                Create a match
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Fill in the details below
              </p>
            </div>
          </div>

          <form onSubmit={handleStartMatch} className="space-y-6 mt-4">
            {renderPlayerInput("p1", "Player 01 username")}
            {renderPlayerInput("p2", "Player 02 username")}

            <div className="space-y-2">
              <Label htmlFor="bestof">Match Format</Label>
              <Select
                value={bestOf.toString()}
                onValueChange={(v) => setBestOf(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Best of 3</SelectItem>
                  <SelectItem value="5">Best of 5</SelectItem>
                  <SelectItem value="7">Best of 7</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={matchPlayers.length !== 2}
            >
              Start Match
            </Button>

            {matchPlayers.length !== 2 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Both players must be registered users to start a match.
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
