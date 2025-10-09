import { axiosInstance } from "@/lib/axiosInstance";
import { useMatchStore } from "@/hooks/useMatchStore";
import { throttle } from "lodash";
import { ServerKey } from "@/types/match.type";

// 🔄 Define throttled internal function
const _updateServer = async (matchId: string, currentServer: ServerKey) => {
  try {
    await axiosInstance.post(`/matches/individual/${matchId}/current-server`, {
      currentServer,
    });

    // ✅ Instantly reflect in local store for fast UI update
    const match = useMatchStore.getState().match;
    if (match) {
      useMatchStore.getState().setMatch({
        ...match,
        currentServer,
      });
    }
  } catch (err) {
    console.error("Failed to update currentServer:", err);
  }
};

// ⏱️ Create a throttled wrapper (1 call per second max)
export const updateCurrentServerInDB = throttle(
  _updateServer,
  1000, // delay in ms
  { leading: true, trailing: true }
);
