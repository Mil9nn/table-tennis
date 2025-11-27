"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useRouter } from "next/navigation";
import { axiosInstance } from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useState, useCallback, useEffect } from "react";
import UserSearchInput from "@/app/match/componets/UserSearchInput";
import Image from "next/image";
import { ChevronLeft, Info, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useAuthStore } from "@/hooks/useAuthStore";

const teamSchema = z.object({
  name: z.string().min(2, "Team name is required"),
  captain: z.string().min(1, "Captain is required"),
  city: z.string().optional(),
  players: z.array(z.string()).min(2, "Add at least 2 players"),
});

type User = {
  _id: string;
  username: string;
  fullName?: string;
  profileImage?: string;
};

export default function CreateTeamPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<User[]>([]);
  const [teamImage, setTeamImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const user = useAuthStore((state) => state.user);

  const form = useForm({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: "", captain: "", city: "", players: [] },
  });

  useEffect(() => {
    if (user?._id) {
      form.setValue("captain", user._id);
    }
  }, [user, form]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setTeamImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
    maxSize: 5242880,
  });

  const removeImage = () => {
    setTeamImage(null);
    setImagePreview(null);
  };

  const addPlayer = (user: User) => {
    const exists = players.some((p) => p._id === user._id);
    if (!exists) {
      const updated = [...players, user];
      setPlayers(updated);
      form.setValue(
        "players",
        updated.map((p) => p._id)
      );
    }
  };

  const removePlayer = (id: string) => {
    const updated = players.filter((p) => p._id !== id);
    setPlayers(updated);
    form.setValue(
      "players",
      updated.map((p) => p._id)
    );
    form.trigger("players");
  };

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("captain", data.captain);
      formData.append("city", data.city || "");
      formData.append("players", JSON.stringify(players.map((p) => p._id)));

      if (teamImage) {
        formData.append("teamImage", teamImage);
      }

      await axiosInstance.post("/teams", formData);

      toast.success("Team created!");
      router.push("/teams");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create team");
    }
  };

  return (
    <div className="min-h-screen bg-[#6C6FD5] p-6">
      {/* HEADER */}
      <header className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-blue-500 bg-gray-100 transition"
        >
          <ChevronLeft className="w-5 h-5 text-[#808996]" />
        </button>

        <div className="flex flex-col items-center mx-auto gap-2">
          <h1 className="sm:text-5xl text-3xl font-semibold text-white tracking-tight">
            Create New Team
          </h1>
          <p className="text-white/89">
            Build your dream team and start competing today
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* IMAGE UPLOAD */}
            <div>
              <FormLabel className="text-sm font-medium text-[#1a202c]">
                Team Logo
              </FormLabel>

              {!imagePreview ? (
                <div
                  {...getRootProps()}
                  className="mt-2 flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-xl p-6 cursor-pointer bg-[#f7fafc] hover:bg-gray-50 transition"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 text-[#667eea] mb-2" />
                  <p className="text-[#808996] text-sm">
                    {isDragActive
                      ? "Drop the image here"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-gray-400">
                    PNG, JPG, GIF (max 5MB)
                  </p>
                </div>
              ) : (
                <div className="mt-3 relative inline-block">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={160}
                    height={160}
                    className="rounded-xl border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* TEAM NAME */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#1a202c]">
                    Team Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter team name"
                      {...field}
                      className="bg-[#f7f7fc] border border-gray-200 text-[#1a202c] placeholder:text-[#808996]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CITY */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#1a202c]">
                    City
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter city"
                      {...field}
                      className="bg-[#f7f7fc] border border-gray-200 text-[#1a202c] placeholder:text-[#808996]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* PLAYERS */}
            <FormField
              control={form.control}
              name="players"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-[#1a202c]">
                    Players
                  </FormLabel>

                  <UserSearchInput
                    placeholder="Search player..."
                    clearAfterSelect
                    onSelect={(u) => {
                      addPlayer(u);
                      field.onChange(players.map((p) => p._id));
                    }}
                  />

                  {/* PLAYER LIST */}
                  <div className="mt-4 space-y-3">
                    {players.length > 0 ? (
                      players.map((p) => (
                        <div
                          key={p._id}
                          className="flex items-center justify-between bg-[#f7fafc] p-3 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            {p.profileImage ? (
                              <Image
                                src={p.profileImage}
                                alt={p.fullName || p.username}
                                width={36}
                                height={36}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-[#667eea] text-white rounded-full flex items-center justify-center text-sm font-medium">
                                {(
                                  p.fullName?.[0] ||
                                  p.username?.[0] ||
                                  "?"
                                ).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[#1a202c] font-medium">
                              {p.fullName || p.username}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removePlayer(p._id)}
                            className="text-sm text-red-500 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[#808996] text-sm">
                        No players added yet.
                      </p>
                    )}

                    <div className="flex items-start gap-2 text-xs text-[#808996]">
                      <Info className="w-4 h-4 text-[#667eea] mt-0.5" />
                      <p>
                        You will be automatically assigned as the team captain.
                      </p>
                    </div>
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#667eea] hover:bg-[#5a6fe0] text-white text-sm font-medium shadow-md"
            >
              Create Team
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
