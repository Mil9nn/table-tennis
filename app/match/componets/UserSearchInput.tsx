"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { User } from "@/types/user";
import { X } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

function UserSearchInput({
  placeholder,
  onSelect,
  clearAfterSelect = false,
}: {
  placeholder: string;
  onSelect: (u: User) => void;
  clearAfterSelect?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [focused, setFocused] = useState(false);

  const fetchSuggestions = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/users/search?q=${val}`);
      setSuggestions(response.data?.users || []);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (u: User) => {
    onSelect(u);

    if (clearAfterSelect) {
      // 🧹 Team creation mode: clear everything after picking
      setQuery("");
      setSuggestions([]);
      setSelectedUser(null);
    } else {
      // 🎯 Individual match mode: show selected user
      setSelectedUser(u);
      setSuggestions([]);
    }
  };

  const handleClear = () => {
    setSelectedUser(null);
    setQuery("");
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative">
      {/* Selected user (for singles/doubles inputs) */}
      {selectedUser && !clearAfterSelect ? (
        <div className="flex items-center justify-between p-2 border rounded-lg bg-muted/40 hover:bg-muted/60 transition-all group">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedUser.profileImage} alt={selectedUser.username} />
              <AvatarFallback>{getInitial(selectedUser.username)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-medium text-foreground">
                {selectedUser.fullName || selectedUser.username}
              </span>
              <span className="text-xs text-muted-foreground">@{selectedUser.username}</span>
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
            onChange={(e) => fetchSuggestions(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)} // short delay to allow click
            className="pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-2.5">
              <BlinkingDotsLoader />
            </div>
          )}
        </>
      )}

      {/* Dropdown suggestions */}
      {focused && suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden animate-in fade-in-50 slide-in-from-top-1">
          {suggestions.map((u) => {
            const displayName = u.fullName || u.username;
            return (
              <li
                key={u._id}
                onMouseDown={() => handleSelect(u)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-muted cursor-pointer transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={u.profileImage} alt={displayName} />
                  <AvatarFallback>{getInitial(displayName)}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium">{displayName}</span>
                  {u.fullName && (
                    <span className="text-xs text-muted-foreground">@{u.username}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default UserSearchInput;