// app/match/play/[matchId]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function PlayMatch({ params }: { params: { matchId: string } }) {
  const { matchId } = params;
  const [match, setMatch] = useState<any>(null);
  const [selectedGame, setSelectedGame] = useState<number>(1);
  const [scorerId, setScorerId] = useState<string>("");
  const [shotSeq, setShotSeq] = useState<{ shotName: string; playerId?: string }[]>([]);
  const [shotInput, setShotInput] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchMatch();
    // poll / subscribe as you like
  }, [matchId]);

  async function fetchMatch() {
    const res = await fetch(`/api/matches?id=${matchId}`);
    const json = await res.json();
    setMatch(json);
  }

  function addShotToSeq() {
    if (!shotInput) return;
    setShotSeq(s => [...s, { shotName: shotInput, playerId: scorerId || undefined }]);
    setShotInput("");
  }

  async function addPoint() {
    if (!scorerId) return alert("choose scorer");
    const payload = {
      matchId,
      op: {
        type: "addPoint",
        payload: { gameNumber: selectedGame, scorerId, shots: shotSeq }
      }
    };
    const res = await fetch("/api/matches", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (!res.ok) return alert("error: " + JSON.stringify(json));
    setShotSeq([]);
    setScorerId("");
    setMatch(json.match);
  }

  if (!match) return <div>Loading...</div>;

  // available scorers (players or sides)
  const scorers = match.category === "individual" ? match.playerOrder : (match.teams ?? []).flatMap((t:any)=> t.players.map((p:any)=>p.userId));

  const games = match.games || [];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Match {match._id} — {match.status}</h2>
        <div>Best of: {match.bestOfGames}</div>
      </div>

      <div>
        <label>Game</label>
        <select value={selectedGame} onChange={(e) => setSelectedGame(Number(e.target.value))} className="border rounded p-2 ml-2">
          {games.map((g:any) => <option key={g.gameNumber} value={g.gameNumber}>Game {g.gameNumber}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-2 p-3 border rounded">
          <h3 className="font-semibold">Add Point</h3>
          <div className="mt-2">
            <label>Scorer</label>
            <select className="border rounded p-2 w-full mt-1" value={scorerId} onChange={(e)=>setScorerId(e.target.value)}>
              <option value="">-- choose --</option>
              {scorers.map((s:any)=> <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="mt-3">
            <label>Shot sequence (add multiple, last shot is the winning shot)</label>
            <div className="flex gap-2 mt-2">
              <Input placeholder="e.g. Forehand Loop" value={shotInput} onChange={(e)=>setShotInput(e.target.value)} />
              <Button type="button" onClick={addShotToSeq}>Add Shot</Button>
            </div>
            <div className="mt-2">
              {shotSeq.map((s, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="text-sm">{idx+1}. {s.shotName} {s.playerId ? `by ${s.playerId}` : ""}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={addPoint}>Add Point</Button>
          </div>

        </div>

        <div className="p-3 border rounded">
          <h3 className="font-semibold">Game Scores</h3>
          <div className="mt-2 space-y-2">
            {games.map((g:any) => (
              <div key={g.gameNumber} className="p-2 border rounded">
                <div className="flex justify-between">
                  <div>Game {g.gameNumber}</div>
                  <div>{g.winnerId ? `Winner: ${g.winnerId}` : "In progress"}</div>
                </div>
                <div className="mt-1 text-sm">
                  Scores: {Object.entries(g.scores || {}).map(([k,v])=> `${k}: ${v}`).join(" | ") || "0-0"}
                </div>
                <div className="mt-2 text-xs">Points: {g.points?.length || 0}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <Button onClick={fetchMatch} variant="ghost">Refresh</Button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold">Match Stats (snapshot)</h3>
        <pre className="bg-slate-100 p-3 rounded max-h-80 overflow-auto">{JSON.stringify(match.stats || {}, null, 2)}</pre>
      </div>
    </div>
  );
}

