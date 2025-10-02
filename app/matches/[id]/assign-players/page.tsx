// app/matches/[id]/assign-players/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";

export default function AssignPlayersPage() {
  const router = useRouter();
  const { id } = useParams();
  
  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team1Assignments, setTeam1Assignments] = useState<Record<string, string>>({});
  const [team2Assignments, setTeam2Assignments] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMatch();
  }, [id]);

  const fetchMatch = async () => {
    try {
      const { data } = await axiosInstance.get(`/matches/team/${id}`);
      setMatch(data.match);
      
      // Load existing assignments if any
      const t1 = {};
      const t2 = {};
      
      if (data.match.team1?.assignments) {
        Object.entries(data.match.team1.assignments).forEach(([key, value]) => {
          (t1 as any)[key] = value;
        });
      }
      
      if (data.match.team2?.assignments) {
        Object.entries(data.match.team2.assignments).forEach(([key, value]) => {
          (t2 as any)[key] = value;
        });
      }
      
      setTeam1Assignments(t1);
      setTeam2Assignments(t2);
    } catch (error) {
      console.error("Error fetching match:", error);
      toast.error("Failed to load match");
    } finally {
      setLoading(false);
    }
  };

  const getRequiredAssignments = (format: string) => {
    const assignments: Record<string, { team1: string[], team2: string[] }> = {
      "swaythling_format": { team1: ["A", "B", "C"], team2: ["X", "Y", "Z"] },
      "single_double_single": { team1: ["A", "B"], team2: ["X", "Y"] },
      "five_singles_full": { 
        team1: ["A", "B", "C", "D", "E"], 
        team2: ["X", "Y", "Z", "P", "Q"] 
      },
      "three_singles": { team1: ["A", "B", "C"], team2: ["X", "Y", "Z"] },
    };
    
    return assignments[format] || { team1: [], team2: [] };
  };

  const handleAssign = (
    team: "team1" | "team2",
    playerId: string,
    assignment: string
  ) => {
    if (team === "team1") {
      setTeam1Assignments(prev => ({ ...prev, [playerId]: assignment }));
    } else {
      setTeam2Assignments(prev => ({ ...prev, [playerId]: assignment }));
    }
  };

  const validateAssignments = () => {
    const required = getRequiredAssignments(match.format);
    
    const team1Values = Object.values(team1Assignments);
    const team2Values = Object.values(team2Assignments);
    
    const team1Valid = required.team1.every(req => team1Values.includes(req));
    const team2Valid = required.team2.every(req => team2Values.includes(req));
    
    return team1Valid && team2Valid;
  };

  const saveAndInitialize = async () => {
    if (!validateAssignments()) {
      toast.error("Please assign all required positions");
      return;
    }
    
    setSaving(true);
    try {
      // Update match with assignments
      await axiosInstance.put(`/matches/team/${id}`, {
        "team1.assignments": team1Assignments,
        "team2.assignments": team2Assignments,
      });
      
      // Initialize submatches
      await axiosInstance.post(`/matches/team/${id}/initialize`);
      
      toast.success("Match initialized successfully!");
      router.push(`/matches/${id}/score`);
    } catch (error: any) {
      console.error("Error initializing match:", error);
      toast.error(error.response?.data?.error || "Failed to initialize match");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="p-8 text-center">
        <p>Match not found</p>
      </div>
    );
  }

  const required = getRequiredAssignments(match.format);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push(`/matches/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold">Assign Players</h1>
          <p className="text-sm text-gray-600">
            {match.team1?.name} vs {match.team2?.name}
          </p>
        </div>
      </div>

      {/* Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Format:</strong> {match.format?.replace(/_/g, " ").toUpperCase()}
        </p>
        <p className="text-xs text-blue-700 mt-1">
          Assign positions to players before starting the match
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Team 1 Assignments */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {match.team1?.name}
            <span className="text-sm text-gray-500">
              ({required.team1.join(", ")})
            </span>
          </h2>
          
          <div className="space-y-3">
            {match.team1?.players?.map((player: any) => (
              <div
                key={player._id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <span className="font-medium">
                  {player.fullName || player.username}
                </span>
                <select
                  value={team1Assignments[player._id] || ""}
                  onChange={(e) => handleAssign("team1", player._id, e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="">Not assigned</option>
                  {required.team1.map((pos) => (
                    <option key={pos} value={pos}>
                      Position {pos}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        {/* Team 2 Assignments */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {match.team2?.name}
            <span className="text-sm text-gray-500">
              ({required.team2.join(", ")})
            </span>
          </h2>
          
          <div className="space-y-3">
            {match.team2?.players?.map((player: any) => (
              <div
                key={player._id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <span className="font-medium">
                  {player.fullName || player.username}
                </span>
                <select
                  value={team2Assignments[player._id] || ""}
                  onChange={(e) => handleAssign("team2", player._id, e.target.value)}
                  className="border rounded px-3 py-1 text-sm"
                >
                  <option value="">Not assigned</option>
                  {required.team2.map((pos) => (
                    <option key={pos} value={pos}>
                      Position {pos}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-8">
        <Button
          onClick={saveAndInitialize}
          disabled={saving || !validateAssignments()}
          className="w-full py-6 text-lg"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Initializing...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2" />
              Save Assignments & Start Match
            </>
          )}
        </Button>
        
        {!validateAssignments() && (
          <p className="text-sm text-red-600 text-center mt-2">
            All required positions must be assigned
          </p>
        )}
      </div>
    </div>
  );
}