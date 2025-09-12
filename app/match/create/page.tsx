// FIXED: app/match/create/page.tsx - Compatible with your tennis store structure
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { AlertCircle, Check, User, Search, ArrowLeft, ArrowLeftCircle } from "lucide-react";
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

interface FoundUser {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  fullName?: string;
}

export default function CreateMatchPage() {
  const router = useRouter();

  // FIX: Use the correct store methods that match your tennis store
  const {
    playerUsers,
    setPlayerUser,
    userSearching,
    setUserSearching,
    userErrors,
    setUserErrors,
    setBestOf,
    bestOf,
    startNewMatch,
    resetToSetup,
  } = useTennisStore();

  // Local state for input fields
  const [player1Input, setPlayer1Input] = useState("");
  const [player2Input, setPlayer2Input] = useState("");

  // Reset store on component mount
  useEffect(() => {
    resetToSetup();
  }, []);

  // Search function that matches your store structure
  const searchUser = async (username: string, slot: "p1" | "p2") => {
    if (!username.trim()) {
      setPlayerUser(slot, null);
      setUserErrors({ ...userErrors, [slot]: "" });
      return;
    }

    setUserSearching({ ...userSearching, [slot]: true });

    try {
      const res = await fetch(
        `/api/users/search?username=${encodeURIComponent(username.trim())}`
      );
      const data = await res.json();

      console.log(`Search result for ${slot}:`, data);

      if (data.success && data.user) {
        // FIX: Create RegisteredUser object that matches your store interface
        const registeredUser = {
          _id: data.user._id,
          username: data.user.username,
          displayName:
            data.user.displayName || data.user.fullName || data.user.username,
          wins: data.user.wins || 0,
          losses: data.user.losses || 0,
          totalMatches: data.user.totalMatches || 0,
        };

        console.log(`Setting ${slot} user:`, registeredUser);

        setPlayerUser(slot, registeredUser);
        setUserErrors({ ...userErrors, [slot]: "" });
      } else {
        setPlayerUser(slot, null);
        setUserErrors({
          ...userErrors,
          [slot]:
            "User not found. Please check username or ask them to register.",
        });
      }
    } catch (err) {
      console.error("User search error:", err);
      setPlayerUser(slot, null);
      setUserErrors({
        ...userErrors,
        [slot]: "Error searching for user. Please try again.",
      });
    } finally {
      setUserSearching({ ...userSearching, [slot]: false });
    }
  };

  // Debounced search effects
  useEffect(() => {
    const timer = setTimeout(() => {
      if (player1Input) {
        searchUser(player1Input, "p1");
      } else {
        setPlayerUser("p1", null);
        setUserErrors({ ...userErrors, p1: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [player1Input]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (player2Input) {
        searchUser(player2Input, "p2");
      } else {
        setPlayerUser("p2", null);
        setUserErrors({ ...userErrors, p2: "" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [player2Input]);

  // FIX: Handle match start using your store's method
  const handleStartMatch = (e: React.FormEvent) => {
    e.preventDefault();

    console.log("Starting match with playerUsers:", playerUsers);

    // Validate both players are found
    if (!playerUsers.p1 || !playerUsers.p2) {
      alert("Both players must be registered users to start a match.");
      return;
    }

    // Check for same user
    if (playerUsers.p1._id === playerUsers.p2._id) {
      alert("Players cannot play against themselves!");
      return;
    }

    try {
      // FIX: Use the store's startNewMatch method which handles everything
      startNewMatch();

      console.log("Match started successfully, navigating to play page");
      router.push("/match/play");
    } catch (error) {
      console.error("Error starting match:", error);
      alert("Error starting match. Please try again.");
    }
  };

  const renderPlayerInput = (
    slot: "p1" | "p2",
    placeholder: string,
    inputValue: string,
    setInputValue: (value: string) => void,
    foundUser: any
  ) => (
    <div className="space-y-2">
      <div className="relative">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={
            userErrors[slot]
              ? "border-red-300"
              : foundUser
              ? "border-green-300"
              : ""
          }
        />
        <div className="absolute right-3 top-3">
          {userSearching[slot] && (
            <Search className="w-4 h-4 animate-pulse text-blue-500" />
          )}
          {!userSearching[slot] && foundUser && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          {!userSearching[slot] && userErrors[slot] && (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      {foundUser && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-green-600" />
            <div>
              <div className="font-medium text-green-800">
                {foundUser.displayName}
              </div>
              <div className="text-sm text-green-600">
                @{foundUser.username}
              </div>
              <div className="text-xs text-green-500">
                {foundUser.totalMatches} matches • {foundUser.wins}W-
                {foundUser.losses}L
              </div>
            </div>
          </div>
        </div>
      )}

      {userErrors[slot] && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-600">
            {userErrors[slot]}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeftCircle className="size-5" />
            </Button>
          </Link>
          <div className="flex items-center mb-4">
            <div className="text-center flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                Create a match
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Enter usernames of registered players
              </p>
            </div>
          </div>

          <form onSubmit={handleStartMatch} className="space-y-6">
            <div className="space-y-2">
              {renderPlayerInput(
                "p1",
                "Enter player 1 username",
                player1Input,
                setPlayer1Input,
                playerUsers.p1
              )}
            </div>

            <div className="space-y-2">
              {renderPlayerInput(
                "p2",
                "Enter player 2 username",
                player2Input,
                setPlayer2Input,
                playerUsers.p2
              )}
            </div>

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
              disabled={
                !playerUsers.p1 ||
                !playerUsers.p2 ||
                userSearching.p1 ||
                userSearching.p2
              }
            >
              {!playerUsers.p1 || !playerUsers.p2
                ? "Enter both players"
                : "Start Match"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
