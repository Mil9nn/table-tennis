"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import BlinkingDotsLoader from "../loaders/BlinkingDotsLoader";

type Team = {
  _id: string;
  name: string;
  logo?: string;
};

interface TeamSearchInputProps {
  placeholder?: string;
  onSelect: (team: Team) => void;
  clearAfterSelect?: boolean;
  defaultValue?: string;
}

export default function TeamSearchInput({
  placeholder = "Search teams...",
  onSelect,
  clearAfterSelect = false,
  defaultValue,
}: TeamSearchInputProps) {
  const [query, setQuery] = useState(defaultValue || "");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setTeams([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/teams/search?query=${query}`);
        if (res.data.success) {
          setTeams(res.data.teams || []);
        }
      } catch (err) {
        console.error("Failed to search teams:", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (team: Team) => {
    setSelectedTeam(team);
    onSelect(team);
    if (clearAfterSelect) setQuery("");
    else setQuery(team.name);
    setTeams([]);
  };

  const handleClear = () => {
    setSelectedTeam(null);
    setQuery("");
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative w-full">
      {/* Selected Team Display */}
      {selectedTeam ? (
        <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/40 hover:bg-muted/60 transition-all group">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedTeam.logo} alt={selectedTeam.name} />
              <AvatarFallback className="bg-indigo-500">{getInitial(selectedTeam.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium leading-none text-sm text-foreground">
                {selectedTeam.name}
              </p>
            </div>
          </div>
          <button
            onClick={handleClear}
            type="button"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            className="pr-10"
          />
          {loading && (
            <BlinkingDotsLoader className="absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </>
      )}

      {/* Dropdown */}
      {focused && teams.length > 0 && !selectedTeam && (
        <div className="absolute z-50 mt-1 w-full bg-background border rounded-lg shadow-lg overflow-y-auto max-h-64 animate-in fade-in-50 slide-in-from-top-1">
          {teams.map((team) => (
            <button
              key={team._id}
              type="button"
              onMouseDown={() => handleSelect(team)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-left"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={team.logo} alt={team.name} />
                <AvatarFallback className="bg-indigo-500">{getInitial(team.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{team.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}