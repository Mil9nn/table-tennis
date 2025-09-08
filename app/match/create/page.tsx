"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";
import { AlertCircle, Check, User, Search, SearchCheck } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTennisStore } from "@/hooks/useTennisStore";

interface RegisteredUser {
  _id: string;
  username: string;
  displayName: string;
  wins: number;
  losses: number;
  totalMatches: number;
}

export default function MatchSetupForm() {
  const {
    player1Username,
    player2Username,
    player1User,
    player2User,
    userSearching,
    userErrors,
    bestOf,
    setPlayer1Username,
    setPlayer2Username,
    setPlayer1User,
    setPlayer2User,
    setUserSearching,
    setUserErrors,
    setBestOf,
    startNewMatch,
  } = useTennisStore();

  // Simple user search by exact username
  const searchUser = async (username: string, playerNum: 1 | 2) => {
    if (!username.trim()) {
      if (playerNum === 1) {
        setPlayer1User(null);
        setUserErrors((prev) => ({ ...prev, p1: "" }));
      } else {
        setPlayer2User(null);
        setUserErrors((prev) => ({ ...prev, p2: "" }));
      }
      return;
    }

    setUserSearching((prev) => ({
      ...prev,
      [playerNum === 1 ? "p1" : "p2"]: true,
    }));

    try {
      const response = await fetch(
        `/api/users/search?username=${encodeURIComponent(username.trim())}`
      );
      const data = await response.json();

      if (data.success && data.user) {
        if (playerNum === 1) {
          setPlayer1User(data.user);
          setUserErrors((prev) => ({ ...prev, p1: "" }));
        } else {
          setPlayer2User(data.user);
          setUserErrors((prev) => ({ ...prev, p2: "" }));
        }
      } else {
        if (playerNum === 1) {
          setPlayer1User(null);
          setUserErrors((prev) => ({
            ...prev,
            p1: "User not found. Please check username or ask them to register.",
          }));
        } else {
          setPlayer2User(null);
          setUserErrors((prev) => ({
            ...prev,
            p2: "User not found. Please check username or ask them to register.",
          }));
        }
      }
    } catch (error) {
      console.error("Error searching user:", error);
      const errorMsg = "Error searching for user. Please try again.";
      if (playerNum === 1) {
        setPlayer1User(null);
        setUserErrors((prev) => ({ ...prev, p1: errorMsg }));
      } else {
        setPlayer2User(null);
        setUserErrors((prev) => ({ ...prev, p2: errorMsg }));
      }
    } finally {
      setUserSearching((prev) => ({
        ...prev,
        [playerNum === 1 ? "p1" : "p2"]: false,
      }));
    }
  };

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (player1Username) {
        searchUser(player1Username, 1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [player1Username]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (player2Username) {
        searchUser(player2Username, 2);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [player2Username]);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">
        Table Tennis Scorer
      </h1>

      <div className="space-y-6">
        {/* Player 1 */}
        <div>
          <Label htmlFor="player1">Player 1 Username</Label>
          <div className="relative">
            <Input
              id="player1"
              placeholder="Enter username"
              value={player1Username}
              onChange={(e) => setPlayer1Username(e.target.value)}
              className={
                userErrors.p1
                  ? "border-red-300"
                  : player1User
                  ? "border-green-300"
                  : ""
              }
            />
            <div className="absolute right-3 top-3">
              {userSearching.p1 && (
                <Search className="w-4 h-4 animate-bounce" />
              )}
              {!userSearching.p1 && player1User && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {!userSearching.p1 && userErrors.p1 && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          {player1User && (
            <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <div className="text-sm">
                <div className="font-medium">{player1User.displayName}</div>
                <div className="text-gray-600">
                  {player1User.wins}W-{player1User.losses}L (
                  {player1User.totalMatches} matches)
                </div>
              </div>
            </div>
          )}
          {userErrors.p1 && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {userErrors.p1}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Player 2 */}
        <div>
          <Label htmlFor="player2">Player 2 Username</Label>
          <div className="relative">
            <Input
              id="player2"
              placeholder="Enter username"
              value={player2Username}
              onChange={(e) => setPlayer2Username(e.target.value)}
              className={
                userErrors.p2
                  ? "border-red-300"
                  : player2User
                  ? "border-green-300"
                  : ""
              }
            />
            <div className="absolute right-3 top-3">
              {userSearching.p2 && (
                <Search className="w-4 h-4 animate-bounce" />
              )}
              {!userSearching.p2 && player2User && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {!userSearching.p2 && userErrors.p2 && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          </div>
          {player2User && (
            <div className="mt-2 p-2 bg-green-50 rounded flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              <div className="text-sm">
                <div className="font-medium">{player2User.displayName}</div>
                <div className="text-gray-600">
                  {player2User.wins}W-{player2User.losses}L (
                  {player2User.totalMatches} matches)
                </div>
              </div>
            </div>
          )}
          {userErrors.p2 && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {userErrors.p2}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          <Label htmlFor="bestof">Match Format</Label>
          <Select
            value={bestOf.toString()}
            onValueChange={(value) => setBestOf(parseInt(value))}
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
          onClick={startNewMatch}
          className="w-full"
          size="lg"
          disabled={!player1User || !player2User}
        >
          Start Match
        </Button>

        {(!player1User || !player2User) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Both players must be registered users to start a match. If a
              player doesn't exist, they need to register first.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}