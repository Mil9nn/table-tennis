"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { axiosInstance } from "@/lib/axiosInstance";
import BlinkingDotsLoader from "../loaders/BlinkingDotsLoader";
import { getInitial } from "@/lib/utils";

type Team = {
  _id: string;
  name: string;
  logo?: string;
};

interface TeamSearchInputProps {
  placeholder?: string;
  onSelect: (team: Team) => void;
  clearAfterSelect?: boolean;
  value?: string;
  onChange?: (value: string) => void;
}

export default function TeamSearchInput({
  placeholder = "Search teams",
  onSelect,
  clearAfterSelect = false,
  value,
  onChange,
}: TeamSearchInputProps) {
  const [query, setQuery] = useState(value ?? "");
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  const currentQuery = value !== undefined ? value : query;

  const updateQuery = (val: string) => {
    setQuery(val);
    onChange?.(val);
  };

  useEffect(() => {
    if (currentQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(
          `/teams/search?query=${currentQuery}`
        );
        if (res.data?.success) {
          setResults(res.data.teams ?? []);
        }
      } catch (e) {
        console.error("Team search failed:", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [currentQuery]);

  const handleSelect = (team: Team) => {
    onSelect(team);

    if (clearAfterSelect) {
      updateQuery("");
      setResults([]);
    } else {
      setSelectedTeam(team);
      updateQuery("");
      setResults([]);
    }
  };

  const clearSelection = () => {
    setSelectedTeam(null);
    updateQuery("");
  };

  return (
    <div className="relative w-full">
      {/* Selected Team */}
      {selectedTeam && !clearAfterSelect ? (
        <div className="flex items-center justify-between px-3 py-2 border border-[#d9d9d9] bg-white">
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={selectedTeam.logo} />
              <AvatarFallback>
                {getInitial(selectedTeam.name)}
              </AvatarFallback>
            </Avatar>

            <div className="text-sm font-medium text-[#353535] leading-tight">
              {selectedTeam.name}
            </div>
          </div>

          <button
            onClick={clearSelection}
            className="text-[#8c8c8c] hover:text-[#353535] transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          {/* Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8c8c8c]" />

            <Input
              value={currentQuery}
              onChange={(e) => updateQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 120)}
              placeholder={placeholder}
              className="
                pl-9 pr-9 h-10
                border-[#d9d9d9]
                focus-visible:ring-0
                focus:border-[#3c6e71]
                placeholder:text-[#bfbfbf]
                text-sm
              "
            />

            {loading && (
              <div className="absolute right-3 top-2.5">
                <BlinkingDotsLoader />
              </div>
            )}
          </div>

          {/* Dropdown */}
          {focused && currentQuery.trim().length >= 2 && !loading && (
            <div className="absolute z-30 mt-1 w-full border border-[#d9d9d9] bg-white max-h-64 overflow-y-auto">
              {results.length > 0 ? (
                results.map((team) => (
                  <button
                    key={team._id}
                    onMouseDown={() => handleSelect(team)}
                    className="
                      w-full flex items-center gap-3 px-3 py-2
                      hover:bg-[#f7f7f7]
                      transition text-left
                    "
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={team.logo} />
                      <AvatarFallback>
                        {getInitial(team.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="text-sm font-medium text-[#353535]">
                      {team.name}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-[#8c8c8c] text-center">
                  No teams found
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}