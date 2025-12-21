"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { registerSchema } from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const Page = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const register = useAuthStore((state) => state.register);
  const authLoading = useAuthStore((state) => state.authLoading);

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      email: "",
      password: "",
    },
  });

  const password = form.watch("password");

  // Password strength evaluator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score === 3) return { score, label: "Fair", color: "bg-yellow-500" };
    if (score === 4) return { score, label: "Good", color: "bg-blue-500" };
    return { score, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  async function onSubmit(values: RegisterInput) {
    await register(values);
    router.push("/complete-profile");
  }

  return (
    <div className="min-h-[calc(100vh-105px)] flex items-center justify-center bg-linear-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 p-8 space-y-6 rounded-xl shadow-sm">
          {/* Header */}
          <div className="text-center">
            <Image
              src="/imgs/logo.png"
              alt="Brand Logo"
              width={80}
              height={80}
              className="mx-auto opacity-90"
            />
            <h2 className="text-2xl font-bold text-gray-800 mt-4">
              Create Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Sign up to get started
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Username */}
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Username"
                        className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Full Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Full name"
                        className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Email address"
                        type="email"
                        className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="border-gray-200 focus:ring-2 focus:ring-indigo-500 pr-12"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </button>
                      </div>
                    </FormControl>

                    {/* Strength meter */}
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full ${
                                level <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">
                          Strength:{" "}
                          <span className="font-medium">
                            {passwordStrength.label}
                          </span>
                        </p>
                      </div>
                    )}

                    {/* Minimal helper */}
                    <p className="text-xs text-gray-500">
                      Use 8+ characters with letters, numbers & symbols.
                    </p>

                    {/* Only show rules if weak */}
                    {password && passwordStrength.label === "Weak" && (
                      <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
                        <li>• At least 8 characters</li>
                        <li>• One uppercase letter</li>
                        <li>• One number or symbol</li>
                      </ul>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                className="w-full bg-blue-500 hover:opacity-90 transition"
                disabled={authLoading}
              >
                {authLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </Form>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 font-medium hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
