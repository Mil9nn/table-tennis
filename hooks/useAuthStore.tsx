import { axiosInstance } from "@/lib/axiosInstance";
import { create } from "zustand";
import type { RegisterForm, LoginForm } from "@/types/auth";
import { AxiosError } from "axios";
import { User } from "@/types/user";
import { toast } from "sonner";

interface AuthState {
    authLoading: boolean;
    fetchUser: () => Promise<void>;
    register: (formData: RegisterForm) => Promise<void>;
    login: (formData: LoginForm) => Promise<void>;
    logout: () => Promise<void>;
    user: User | null;
}

export const useAuthStore = create<AuthState>((set) => ({
    authLoading: false,
    user: null,

    async fetchUser() {
        set({ authLoading: true });
        try {
            const response = await axiosInstance.get("auth/me");
            set({ user: response.data.user });
        } catch (error) {
            set({ user: null });
            console.error("Fetch user error:", error);
        } finally {
            set({ authLoading: false });
        }
    },

    async register(formData: RegisterForm) {
        set({ authLoading: true });
        try {
            const response = await axiosInstance.post("auth/register", formData);

            // Auto login after successful registration
            if (response.data.user) {
                set({ user: response.data.user });
            }

            toast.success(response.data.message);
            return response.data;
        } catch (error: AxiosError | any) {
            if (error.response?.status === 400) {
                toast.error(error?.response?.data?.message || "Registration failed");
            } else {
                toast.error("Something went wrong. Please try again.");
            }
            console.error("Registration error:", error);
            throw error;
        } finally {
            set({ authLoading: false });
        }
    },

    async login(formData: LoginForm) {
        set({ authLoading: true });
        try {
            const response = await axiosInstance.post("auth/login", formData);

            if (response.data.user) set({ user: response.data.user });
            toast.success(response.data.message);
            return response.data;
        } catch (error: AxiosError | any) {
            toast.error(error?.response?.data?.message || "Login failed");
            console.error("Login error:", error);
            throw error;
        } finally {
            set({ authLoading: false });
        }
    },

    async logout() {
        set({ authLoading: true });
        try {
            await axiosInstance.post("auth/logout");
            set({ user: null });
            toast.success("Logged out successfully");
        } catch (error) {
            console.error("Logout error:", error);
            // Still clear user on client side even if server request fails
            set({ user: null });
        } finally {
            set({ authLoading: false });
        }
    }
}));