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
    <div className="space-y-6 bg-white">
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
            <section key={player._id} className="border border-[#d9d9d9] p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold tracking-tight text-[#353535]">
                  {player.fullName || player.username}'s winning shot placements
                </p>
              </div>

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
            </section>
          );
        })}
      </div>

      {/* Game-wise Shot Placements - Hide if only 1 game */}
      {!hideByGame && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold tracking-tight text-[#353535]">
            Winning Shot Placement by Game
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
              <div key={player._id} className="space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-semibold text-sm text-[#353535]">
                    {player.fullName || player.username}
                  </span>
                  <Badge variant="secondary" className="bg-[#3c6e71]/10 text-[#3c6e71]">
                    {playerGames.reduce((s, g) => s + g.shots.length, 0)} winning shots
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {playerGames.map((game) => (
                    <div
                      key={`${player._id}-game-${game.gameNumber}`}
                      className="border border-[#d9d9d9] p-4"
                    >
                      <div className="pb-2 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-[#353535]">
                          Game {game.gameNumber}
                        </h4>
                        <Badge variant="outline" className="text-xs border-[#d9d9d9] text-[#353535]">
                          {game.shots.length} winning shots
                        </Badge>
                      </div>

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
                    </div>
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
