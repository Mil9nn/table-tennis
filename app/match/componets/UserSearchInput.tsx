"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { User } from "@/types/user";
import { getAvatarFallbackStyle, getInitial } from "@/lib/utils";

interface UserSearchInputProps {
  placeholder?: string;
  onSelect: (user: User) => void;
  clearAfterSelect?: boolean;
}

export default function UserSearchInput({
  placeholder = "Search players",
  onSelect,
  clearAfterSelect = false,
}: UserSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = async (value: string) => {
    setQuery(value);
    if (value.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(`/users/search?q=${value}`);
      setResults(res.data?.users ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user: User) => {
    onSelect(user);

    if (clearAfterSelect) {
      setQuery("");
      setResults([]);
    } else {
      setSelectedUser(user);
      setResults([]);
    }
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setQuery("");
  };

  return (
    <div className="relative w-full">
      {/* Selected State */}
      {selectedUser && !clearAfterSelect ? (
        <div className="flex items-center justify-between px-3 py-2 border border-[#d9d9d9] bg-white rounded-md">
          <div className="flex items-center gap-3">
            <Avatar className="h-7 w-7">
              <AvatarImage src={selectedUser.profileImage} />
              <AvatarFallback style={getAvatarFallbackStyle(selectedUser._id)}>
                {getInitial(selectedUser.username)}
              </AvatarFallback>
            </Avatar>

            <div className="leading-tight">
              <div className="text-sm font-medium text-[#353535]">
                {selectedUser.fullName || selectedUser.username}
              </div>
              <div className="text-[11px] text-[#8c8c8c] tracking-wide">
                @{selectedUser.username}
              </div>
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
              value={query}
              onChange={(e) => fetchUsers(e.target.value)}
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
          {focused && query.length >= 2 && !loading && (
            <div className="absolute z-30 mt-1 w-full border border-[#d9d9d9] bg-white max-h-64 overflow-y-auto">
              {results.length > 0 ? (
                results.map((user) => (
                  <button
                    key={user._id}
                    onMouseDown={() => handleSelect(user)}
                    className="
                      w-full flex items-center gap-3 px-3 py-2
                      hover:bg-[#f7f7f7]
                      transition text-left
                    "
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback style={getAvatarFallbackStyle(user._id)}>
                        {getInitial(user.username)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="leading-tight">
                      <div className="text-sm font-medium text-[#353535]">
                        {user.fullName || user.username}
                      </div>
                      {user.fullName && (
                        <div className="text-[11px] text-[#8c8c8c] tracking-wide">
                          @{user.username}
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-[#8c8c8c] text-center">
                  No players found
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}