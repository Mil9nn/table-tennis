import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import WagonWheel from "@/components/WagonWheel";

import { motion, AnimatePresence } from "framer-motion";

interface Participant {
  _id: string;
  fullName?: string;
  username: string;
}

interface Game {
  gameNumber: number;
  shots: any[];
}

interface WagonWheelSectionProps {
  participants: Participant[];
  allShots: any[];
  games: Game[];
  hideByGame?: boolean;
}

export function WagonWheelSection({
  participants,
  allShots,
  games,
  hideByGame = false,
}: WagonWheelSectionProps) {
  return (
    <div className="space-y-4 p-2">
      {/* Player Combined Shots */}
      <div className="grid md:grid-cols-2 gap-6">
        {participants.map((player) => {
          const playerShots = allShots.filter((shot) => {
            const id =
              typeof shot.player === "string"
                ? shot.player
                : shot.player._id || shot.player.toString();
            return id === player._id.toString();
          });

          if (!playerShots.length) return null;

          return (
            <Card
              key={player._id}
              className="rounded-2xl border border-gray-800 bg-black text-white shadow-lg"
            >
              <div className="px-4">
                <p className="text-lg font-semibold tracking-tight">
                  {player.fullName || player.username}'s shot placement points
                </p>
              </div>

              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={JSON.stringify(playerShots)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <WagonWheel key={`${player._id}-wagonwheel`} shots={playerShots} animateOnce />
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Game-wise Shot Placements - Hide if only 1 game */}
      {!hideByGame && (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold tracking-tight">
          Shot Placement by Game
        </h3>

        {participants.map((player) => {
          const playerGames = games
            .map((g) => ({
              gameNumber: g.gameNumber,
              shots:
                g.shots?.filter((shot) => {
                  const id =
                    typeof shot.player === "string"
                      ? shot.player
                      : shot.player._id || shot.player.toString();
                  return id === player._id.toString();
                }) || [],
            }))
            .filter((x) => x.shots.length > 0);

          if (!playerGames.length) return null;

          return (
            <div key={player._id} className="space-y-2">
              <div className="flex items-center gap-4 mb-2">
                <span className="font-semibold">
                  {player.fullName || player.username}
                </span>

                <Badge variant="secondary">
                  {playerGames.reduce((s, g) => s + g.shots.length, 0)} points
                </Badge>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {playerGames.map((game) => (
                  <Card
                    key={`${player._id}-game-${game.gameNumber}`}
                    className="rounded-2xl border border-gray-800 bg-black text-white shadow-lg"
                  >
                    <CardHeader className="pb-2 flex items-center justify-between">
                      <CardTitle className="text-sm">
                        Game {game.gameNumber}
                      </CardTitle>

                      <Badge variant="outline" className="text-xs bg-white">
                        {game.shots.length} points
                      </Badge>
                    </CardHeader>

                    <CardContent>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={JSON.stringify(game.shots)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        >
                          <WagonWheel
                            key={`${player._id}-game-${game.gameNumber}-wagonwheel`}
                            shots={game.shots}
                            animateOnce
                          />
                        </motion.div>
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
