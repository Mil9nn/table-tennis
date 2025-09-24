"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Users, Plus, Trophy } from "lucide-react";
import { axiosInstance } from "@/lib/axiosInstance";
import toast from "react-hot-toast";

type Team = {
  _id: string;
  name: string;
  city?: string;
  record?: { wins: number; losses: number }; // optional
  captain?: { username: string; fullName?: string };
  players: {
    user: { _id: string; username: string; fullName?: string };
    role?: string;
    assignment?: string; // added for A, B, C, etc.
  }[];
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      const res = await axiosInstance.get("/teams");
      setTeams(res.data.teams || []);
    } catch (err) {
      console.error("Error fetching teams", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const deleteTeam = async (id: string) => {
    if (!confirm("Are you sure you want to delete this team?")) return;
    try {
      await axiosInstance.delete(`/teams/${id}`);
      toast.success("Team deleted");
      fetchTeams();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete team");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading teams...</div>;

  return (
    <div className="space-y-6 p-2">
      {/* Header */}
      <header className="flex justify-between items-center p-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">Teams</h1>
        <Link href="/teams/create">
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Team
          </Button>
        </Link>
      </header>

      {/* Card Layout */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((t) => (
          <div
            key={t._id}
            className="border rounded-lg shadow-sm p-4 bg-white flex flex-col justify-between"
          >
            {/* Team Header */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-semibold">{t.name}</h2>
              <div className="flex gap-2">
                <Link href={`/teams/${t._id}/edit`}>
                  <Pencil className="w-5 h-5 text-gray-600 cursor-pointer hover:text-black" />
                </Link>
                <Trash2
                  className="w-5 h-5 text-red-600 cursor-pointer hover:text-red-800"
                  onClick={() => deleteTeam(t._id)}
                />
              </div>
            </div>

            {/* Captain / Record / Players */}
            <div className="p-2 space-y-2">
              <p className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Captain:</span>
                <span className="font-semibold">
                  {t.captain?.fullName || t.captain?.username || "-"}
                </span>
              </p>
              <p className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-500">Players:</span>
                <span className="font-semibold">{t.players?.length || 0}</span>
              </p>
              <p className="flex items-center justify-between text-sm mb-3">
                <span className="font-medium text-gray-500">Record:</span>
                <span className="font-semibold">
                  {t.record
                    ? `${t.record.wins}W - ${t.record.losses}L`
                    : "0W - 0L"}
                </span>
              </p>
            </div>

            <hr className="my-2" />

            {/* Player List */}
            <div className="space-y-1 text-sm">
              <p className="font-medium">Players:</p>
              <div className="p-2 space-y-2 h-30 overflow-y-auto">
                {t.players.map((p) => (
                  <div key={p.user._id} className="flex justify-between">
                    <span className="text-gray-500 font-semibold">
                      {p.user.fullName || p.user.username}
                    </span>
                    {p.assignment && (
                      <span className="text-xs px-2 py-0.5 border rounded bg-gray-100">
                        {p.assignment}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              <Link href={`/teams/${t._id}/assign`} className="flex-1">
                <Button variant="outline" className="w-full gap-1">
                  Assign A - B - C
                </Button>
              </Link>
              <Button variant="outline" className="flex-1 gap-1">
                <Trophy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
