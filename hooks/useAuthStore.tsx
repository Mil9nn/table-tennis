import { create } from 'zustand'

interface User {
    username: string;
    email: string;
    password: string;
}

interface AuthState {
    user: User | null;
    setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
