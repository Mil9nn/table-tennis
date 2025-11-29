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
import { Loader2, Calendar, MapPin, Edit3, VenusAndMars } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";

const profileSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female"], {
    message: "Please select a gender",
  }),
  handedness: z.enum(["left", "right"], {
    message: "Please select your handedness",
  }),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

const CompleteProfilePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useAuthStore();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      dateOfBirth: "",
      phoneNumber: "",
      location: "",
      bio: "",
    },
  });

  // ----------------------------
  // 🔥 Progress bar calculation
  // ----------------------------
  const requiredFields = [
    "dateOfBirth",
    "gender",
    "handedness",
  ];

  type FormValues = z.infer<typeof profileSchema>;

  const total = requiredFields.length;
  const watchedValues = form.watch();

  const completed = requiredFields.filter((field) => {
    const value = watchedValues[field as keyof FormValues];
    return value !== undefined && value !== "" && value !== null;
  }).length;

  const progressPercent = (completed / total) * 100;

  // ----------------------------
  // Submit Handler
  // ----------------------------
  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsLoading(true);
    try {
      await axiosInstance.put("/auth/complete-profile", {
        ...values,
        isProfileComplete: true,
      });

      await fetchUser();
      toast.success("Profile completed successfully!");
      router.push("/profile");
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to complete profile"
      );
      console.error("Profile completion error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-65px)] bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-xl border border-gray-100 overflow-hidden">
          {/* ---------------- Header ---------------- */}
          <div className="bg-blue-400 p-8 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Complete Your Profile
                </h1>
                <p className="text-white/89 mt-1">
                  Just a few more details to get started
                </p>
              </div>

              {/* Skip Button */}
              <Button
                variant={"outline"}
                className="text-blue-500 hover:text-blue-700 text-sm rounded-full font-medium transition"
                onClick={() => router.push("/")}
              >
                Skip
              </Button>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <p className="text-sm text-white/95 mb-1">
                {completed} out of {total} fields completed
              </p>

              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* ---------------- Form ---------------- */}
          <div className="p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date of Birth */}
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <Calendar size={16} className="text-indigo-500" />
                          Date of Birth
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
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
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <VenusAndMars className="text-indigo-500 size-5" />
                          Gender
                        </FormLabel>

                        <div className="flex gap-2 mt-2">
                          {["male", "female"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => field.onChange(option)}
                              className={`px-4 py-2 text-xs rounded-md border transition
                                ${
                                  field.value === option
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                              {option.charAt(0).toUpperCase() + option.slice(1)}
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
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          Playing Hand
                        </FormLabel>

                        <div className="flex gap-2 mt-2">
                          {["right", "left"].map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => field.onChange(option)}
                              className={`px-4 py-2 text-xs rounded-md border transition
                                ${
                                  field.value === option
                                    ? "bg-blue-500 text-white"
                                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                                }`}
                            >
                              {option === "right"
                                ? "Right-handed"
                                : "Left-handed"}
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
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <MapPin size={16} className="text-indigo-500" />
                          Location
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="City, Country"
                            className="border-gray-200 focus:ring-2 focus:ring-indigo-500"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Bio
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us about yourself..."
                          className="border-gray-200 focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-xs text-gray-500">
                        {field.value?.length || 0}/500 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-500 text-white rounded-full font-medium py-6 text-sm 
                      transition transform hover:scale-[1.02] active:scale-95 
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        <span>Completing Profile...</span>
                      </div>
                    ) : (
                      "Next"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
