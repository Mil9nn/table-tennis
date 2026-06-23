"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import {
  Loader2,
  Calendar,
  MapPin,
  User as UserIcon,
  VenusAndMars,
} from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { User } from "@/types/user";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  handedness: z.enum(["left", "right", "ambidextrous"]).optional(),
  phoneNumber: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
});

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
}

const EditProfileModal = ({ isOpen, onClose, user }: EditProfileModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { fetchUser } = useAuthStore();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
      dateOfBirth: user.dateOfBirth
        ? new Date(user.dateOfBirth).toISOString().split("T")[0]
        : "",
      gender: user.gender,
      handedness: user.handedness,
      phoneNumber: user.phoneNumber || "",
      location: user.location || "",
      bio: user.bio || "",
    },
  });

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.fullName || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: user.gender,
        handedness: user.handedness,
        phoneNumber: user.phoneNumber || "",
        location: user.location || "",
        bio: user.bio || "",
      });
    }
  }, [user, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setIsLoading(true);
    try {
      await axiosInstance.put("/auth/update-profile", values);

      // Refresh user data
      await fetchUser();

      toast.success("Profile updated successfully!");
      onClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-none p-0">
        <DialogHeader className="bg-[#ffffff] px-6 py-6 border-b border-[#d9d9d9]">
          <DialogTitle className="text-2xl text-left font-bold text-[#353535]">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-left text-[#8b8b8b]">
            Update your profile information
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
            {/* Full Name */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#353535] font-semibold text-sm flex items-center gap-2">
                    Full Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your full name"
                      className="border-[#d9d9d9] text-[#353535] focus:ring-2 focus:ring-[#3c6e71] focus:border-transparent bg-[#ffffff]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date of Birth */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#353535] font-semibold text-sm flex items-center gap-2">
                      <Calendar size={16} className="text-[#3c6e71]" />
                      Date of Birth
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="border-[#d9d9d9] text-[#353535] focus:ring-2 focus:ring-[#3c6e71] focus:border-transparent bg-[#ffffff]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#353535] font-semibold text-sm flex items-center gap-2">
                      <VenusAndMars className="text-[#3c6e71] size-5" />
                      Gender
                    </FormLabel>

                    <div className="flex gap-2 mt-2">
                      {["male", "female"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.onChange(option)}
                          className={`px-4 py-2 text-xs rounded-sm border font-medium focus:outline-none transition
                            ${
                              field.value === option
                                ? "bg-[#3c6e71] text-[#ffffff] border-[#3c6e71]"
                                : "bg-[#ffffff] text-[#353535] border-[#d9d9d9] hover:border-[#3c6e71]"
                            }`}
                        >
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </button>
                      ))}
                    </div>

                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Handedness */}
              <FormField
                control={form.control}
                name="handedness"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#353535] font-semibold text-sm flex items-center gap-2">
                      Playing Hand
                    </FormLabel>

                    <div className="flex gap-2 mt-2">
                      {["right", "left"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => field.onChange(option)}
                          className={`px-4 py-2 text-xs rounded-sm border font-medium focus:outline-none transition
                            ${
                              field.value === option
                                ? "bg-[#3c6e71] text-[#ffffff] border-[#3c6e71]"
                                : "bg-[#ffffff] text-[#353535] border-[#d9d9d9] hover:border-[#3c6e71]"
                            }`}
                        >
                          {option === "right" ? "Right-handed" : "Left-handed"}
                        </button>
                      ))}
                    </div>

                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#353535] font-semibold text-sm flex items-center gap-2">
                      <MapPin size={16} className="text-[#3c6e71]" />
                      Location
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="City, Country"
                        className="border-[#d9d9d9] text-[#353535] focus:ring-2 focus:ring-[#3c6e71] focus:border-transparent bg-[#ffffff]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
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
                  <FormLabel className="text-[#353535] font-semibold text-sm">
                    Bio
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself and your table tennis journey..."
                      className="border-[#d9d9d9] text-[#353535] focus:ring-2 focus:ring-[#3c6e71] focus:border-transparent bg-[#ffffff] min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-[#8b8b8b]">
                    {field.value?.length || 0}/500 characters
                  </p>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-[#d9d9d9]">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="border-[#d9d9d9] text-[#353535] hover:bg-[#f5f5f5]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#3c6e71] text-[#ffffff] hover:bg-[#2d5559]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileModal;
