"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";

export default function AssignPage() {
  const router = useRouter();

  const { id } = useParams();
  const [team, setTeam] = useState<any>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    const res = await axiosInstance.get(`/teams/${id}`);
    setTeam(res.data.team);
  };

  const handleAssign = (playerId: string, symbol: string) => {
    setAssignments((prev) => ({ ...prev, [playerId]: symbol }));
  };

  const saveAssignments = async () => {
    try {
      await axiosInstance.put(`/teams/${id}`, {
        assignments,
      });
      toast.success("Assignments saved");
      router.push("/teams");
    } catch (err) {
      console.error("Save failed", err);
      toast.error("Failed to save assignments");
    }
  };

  if (!team) return <div className="p-8 text-center">Loading team...</div>;

  const availableSymbols = ["A", "B", "C", "D", "E", "X", "Y", "Z", "P", "Q"];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">Assign Players – {team.name}</h1>

      <div className="space-y-4">
        {team.players.map((p: any) => (
          <div
            key={p.user._id}
            className="flex justify-between items-center border p-3 rounded"
          >
            <span>
              {p.user.fullName || p.user.username}
            </span>
            <select
              value={assignments[p.user._id] || ""}
              onChange={(e) => handleAssign(p.user._id, e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">-- Select --</option>
              {availableSymbols.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <Button onClick={saveAssignments} className="w-full">
        Save Assignments
      </Button>
    </div>
  );
}