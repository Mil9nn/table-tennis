"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { registerSchema } from "@/lib/validations/auth";
import type { RegisterInput } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

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
  
  // Password strength checker
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd)) strength++;
    
    if (strength <= 2) return { strength, label: "Weak", color: "bg-red-500" };
    if (strength <= 3) return { strength, label: "Fair", color: "bg-yellow-500" };
    if (strength <= 4) return { strength, label: "Good", color: "bg-blue-500" };
    return { strength, label: "Strong", color: "bg-green-500" };
  };

  const passwordStrength = getPasswordStrength(password || "");

  async function onSubmit(values: RegisterInput) {
    await register(values);
    // After registration, always redirect to complete profile
    router.push("/complete-profile");
  }

  return (
    <div className="min-h-[calc(100vh-105px)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 p-8 space-y-4">
          <div className="text-center">
            <Image
              src="/imgs/logo.png"
              alt="Brand Logo"
              width={30}
              height={30}
              className="h-20 w-20 mb-4 mx-auto opacity-90"
            />
            <h2 className="text-2xl font-bold text-gray-800">Create Account</h2>
            <p className="text-gray-500 text-sm mt-1">Sign up to get started</p>
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
                        placeholder="Username (3-30 characters, alphanumeric, _, -)"
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
                          placeholder="Password (min 8 chars with uppercase, lowercase, number, special char)"
                          type={showPassword ? "text" : "password"}
                          className="border-gray-200 focus:ring-2 focus:ring-indigo-500 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-sm"
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </FormControl>
                    {password && (
                      <div className="space-y-1">
                        <div className="flex gap-1 h-1.5">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`flex-1 rounded-full ${
                                level <= passwordStrength.strength
                                  ? passwordStrength.color
                                  : "bg-gray-200"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-600">
                          Strength: <span className="font-medium">{passwordStrength.label}</span>
                        </p>
                      </div>
                    )}
                    <FormMessage />
                    <div className="text-xs text-gray-500 space-y-0.5">
                      <p>Password must contain:</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li className={password && password.length >= 8 ? "text-green-600" : ""}>
                          At least 8 characters
                        </li>
                        <li className={password && /[A-Z]/.test(password) ? "text-green-600" : ""}>
                          One uppercase letter
                        </li>
                        <li className={password && /[a-z]/.test(password) ? "text-green-600" : ""}>
                          One lowercase letter
                        </li>
                        <li className={password && /[0-9]/.test(password) ? "text-green-600" : ""}>
                          One number
                        </li>
                        <li className={password && /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password) ? "text-green-600" : ""}>
                          One special character (!@#$%^&*...)
                        </li>
                      </ul>
                    </div>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="cursor-pointer w-full bg-blue-500 text-white font-medium transition transform 
             hover:scale-[1.02] active:scale-95 hover:opacity-90"
              >
                {authLoading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <span>Register</span>
                )}
              </Button>
            </form>
          </Form>

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
