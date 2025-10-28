"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const LoginPage = () => {
  const router = useRouter();

  const login = useAuthStore((state: any) => state.login); // assuming you add `login` in store
  const authLoading = useAuthStore((state) => state.authLoading);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    await login(values);
    router.push("/");
  }

  return (
    <div className="min-h-[calc(100vh-105px)] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/70 p-8 space-y-4">
          <div className="text-center">
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
                    <FormControl>
                      <Input
                        placeholder="Email address"
                        type="email"
                        className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Password"
                        type="password"
                        className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                className="cursor-pointer w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:opacity-90 transition"
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
