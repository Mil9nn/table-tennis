import { Badge } from "@/components/ui/badge";
import WagonWheel from "@/components/WagonWheel";
import { motion } from "framer-motion";

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
    <section className="space-y-8">
      {/* Combined by player */}
      <div className="grid gap-6 md:grid-cols-2">
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
            <div
              key={player._id}
              className="rounded-xl bg-white px-4 py-3 shadow-[0_0_0_1px_#e6e8eb]"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#353535]">
                  {player.fullName || player.username}
                </span>
                <span className="text-xs text-[#6b7280]">
                  {playerShots.length} shots
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <WagonWheel shots={playerShots} animateOnce />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Game-wise */}
      {!hideByGame && (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-[#353535]">
            Shot placement by game
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
              .filter((g) => g.shots.length);

            if (!playerGames.length) return null;

            return (
              <div key={player._id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#353535]">
                    {player.fullName || player.username}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {playerGames.reduce(
                      (s, g) => s + g.shots.length,
                      0
                    )}{" "}
                    shots
                  </Badge>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {playerGames.map((game) => (
                    <div
                      key={`${player._id}-game-${game.gameNumber}`}
                      className="rounded-lg bg-[#fafafa] p-3"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-[#6b7280]">
                          Game {game.gameNumber}
                        </span>
                        <span className="text-xs text-[#9aa0a6]">
                          {game.shots.length} shots
                        </span>
                      </div>

                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25 }}
                      >
                        <WagonWheel
                          shots={game.shots}
                          animateOnce
                        />
                      </motion.div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}