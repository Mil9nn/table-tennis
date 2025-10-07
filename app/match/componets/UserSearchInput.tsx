"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { User } from "@/types/user";

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

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => fetchSuggestions(e.target.value)}
        className="pr-10"
      />
      {loading && (
        <div className="absolute right-3 top-2.5">
          <BlinkingDotsLoader />
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((u) => {
            const displayName = u.fullName || u.username;
            return (
              <li
                key={u._id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelect(u);
                  setSuggestions([]);
                  clearAfterSelect ? setQuery("") : setQuery(u.username);
                }}
              >
                {/* Avatar */}
                {u.profileImage ? (
                  <img
                    src={u.profileImage}
                    alt={displayName}
                    className="w-8 h-8 rounded-full object-cover shadow-sm border border-gray-100"
                  />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-semibold shadow-sm">
                    {getInitial(displayName)}
                  </div>
                )}

                {/* Name + username */}
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-gray-800">
                    {u.fullName || u.username}
                  </span>
                  {u.fullName && (
                    <span className="text-xs text-gray-500">@{u.username}</span>
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
