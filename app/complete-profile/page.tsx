"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";

const profileSchema = z.object({
  dateOfBirth: z.string().min(1),
  gender: z.enum(["male", "female"]),
  handedness: z.enum(["left", "right"]),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof profileSchema>;

export default function CompleteProfilePage() {
  const router = useRouter();
  const { fetchUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dateOfBirth: "",
      location: "",
      bio: "",
    },
  });

  /* ---------- Progress ---------- */
  const required = ["dateOfBirth", "gender", "handedness"] as const;
  const watched = form.watch();
  const completed = required.filter(
    (k) => watched[k] && watched[k] !== ""
  ).length;
  const progress = (completed / required.length) * 100;

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      await axiosInstance.put("/auth/complete-profile", {
        ...values,
        isProfileComplete: true,
      });
      await fetchUser();
      toast.success("Profile completed");
      router.push("/profile");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-70px)] bg-[#fafafa]">
      <div className="mx-auto max-w-[520px] px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            Complete your profile
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            This helps personalize your experience.
          </p>

          {/* Progress */}
          <div className="mt-4">
            <div className="h-[2px] w-full bg-gray-200 rounded">
              <div
                className="h-full bg-gray-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-gray-500">
              {completed}/{required.length} required fields completed
            </p>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Grid */}
            <div className="grid grid-cols-1 gap-5">
              {/* DOB */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wide text-gray-500">
                      Date of birth
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wide text-gray-500">
                      Gender
                    </FormLabel>
                    <div className="flex gap-2">
                      {["male", "female"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={`h-8 px-3 rounded-md border text-xs transition
                            ${
                              field.value === opt
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-300 text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Handedness */}
              <FormField
                control={form.control}
                name="handedness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wide text-gray-500">
                      Playing hand
                    </FormLabel>
                    <div className="flex gap-2">
                      {["right", "left"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => field.onChange(opt)}
                          className={`h-8 px-3 rounded-md border text-xs transition
                            ${
                              field.value === opt
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-300 text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                          {opt === "right" ? "Right-handed" : "Left-handed"}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wide text-gray-500">
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, Country"
                        className="h-9 text-sm"
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Bio */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] uppercase tracking-wide text-gray-500">
                      Bio
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className="min-h-[90px] text-sm resize-none"
                        placeholder="Short description about you"
                        {...field}
                      />
                    </FormControl>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {field.value?.length || 0}/500
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-full text-sm font-medium"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
