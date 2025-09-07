import { create } from 'zustand'

interface User {
    username: string;
    email: string;
    password: string;
}

interface GameState {
    savedData: any;
    setSavedData: (data: any) => void;
}

export const useGameStore = create<GameState>((set) => ({
  savedData: null,
  setSavedData: (data) => set({ savedData: data }),
}))