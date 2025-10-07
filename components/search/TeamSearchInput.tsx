"use client";

import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [query, setQuery] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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
          setTeams(res.data.teams);
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

  return (
    <div className="relative w-full">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full pr-10"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-indigo-500" />
      )}

      {teams.length > 0 && (
        <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-56 overflow-y-auto">
          {teams.map((team) => (
            <div
              key={team._id}
              onClick={() => handleSelect(team)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-indigo-50"
              )}
            >
              {team.logo ? (
                <img
                  src={team.logo}
                  alt={team.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold">
                  {team.name[0]?.toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{team.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}