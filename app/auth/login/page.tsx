"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { loginSchema } from "@/lib/validations/auth";
import type { LoginInput } from "@/lib/validations/auth";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const LoginPage = () => {

  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const login = useAuthStore((state: any) => state.login);
  const authLoading = useAuthStore((state) => state.authLoading);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginInput) {
    try {
      const response = await login(values);

      // Only redirect if login was successful and we have a user
      if (response?.user) {
        // Check if profile is complete
        if (!response.user.isProfileComplete) {
          router.push("/complete-profile");
        } else {
          router.push("/");
        }
      }
      // If no user in response, login failed - don't redirect
      // Error toast is already shown by the login function
    } catch (error) {
      // Login failed - error toast is already shown by the login function
      // Don't redirect, stay on login page
      console.error("Login submission error:", error);
    }
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
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Login to continue</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          placeholder="Password"
                          type={showPassword ? "text" : "password"}
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
                    <FormMessage />
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
                  <span>Login</span>
                )}
              </Button>
            </form>
          </Form>

          {/* Dont have an account? */}
          <div>
            <p className="text-center text-sm text-gray-500">
              Don't have an account?{" "}
              <Link
                href="/auth/register"
                className="text-indigo-600 hover:text-indigo-700 hover:underline font-medium transition"
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
