import BlinkingDotsLoader from "@/components/loaders/BlinkingDotsLoader";
import { Input } from "@/components/ui/input";
import { axiosInstance } from "@/lib/axiosInstance";
import { User } from "@/types/user";
import { useState } from "react";

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
      const data = response.data;
      setSuggestions(data.users || []);
    } catch (err) {
      console.error("Error fetching suggestions", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => fetchSuggestions(e.target.value)}
      />
      {loading && (
        <div className="absolute right-2 top-2 text-xs">
          <BlinkingDotsLoader />
        </div>
      )}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 bg-white border rounded w-full mt-1 max-h-40 overflow-y-auto shadow">
          {suggestions.map((u) => (
            <li
              key={u._id}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => {
                onSelect(u);
                if (clearAfterSelect) {
                  setQuery("");
                } else {
                  setQuery(u.username);
                }
                setSuggestions([]); // hide list
              }}
            >
              {u.username ? u.username : u.fullName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default UserSearchInput;
