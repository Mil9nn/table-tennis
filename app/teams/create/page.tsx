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
import { ChevronLeft, Info, Upload, X, Loader2 } from "lucide-react";
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
    <div className="min-h-screen bg-white">
      {/* HEADER: Precise & Architectural */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-[0.2em] text-slate-900 leading-none">
                Team Creation
              </h1>
              <p></p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto border border-slate-100 rounded-lg p-1 sm:p-2 bg-slate-50/30">
          <div className="bg-white rounded-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            {/* ═══════════════════════════════════════════
                SECTION 1: TEAM LOGO
            ═══════════════════════════════════════════ */}
            <div className="p-4 space-y-3 border-b border-gray-100">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
                Team Logo
              </h2>

              {!imagePreview ? (
                <div
                  {...getRootProps()}
                  className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded p-6 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 text-slate-600 mb-2" />
                  <p className="text-slate-600 text-sm">
                    {isDragActive
                      ? "Drop the image here"
                      : "Drag & drop or click to upload"}
                  </p>
                  <p className="text-xs text-slate-400">
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
                    className="rounded border border-slate-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════════
                SECTION 2: BASIC INFORMATION
            ═══════════════════════════════════════════ */}
            <div className="p-4 space-y-3 border-b border-gray-100">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
                Basic Information
              </h2>

              {/* TEAM NAME */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                      Team Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter team name"
                        {...field}
                        className="bg-slate-50 border-slate-200 rounded h-10 text-sm placeholder:text-slate-400 placeholder:opacity-70"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {/* CITY */}
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                      City
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter city"
                        {...field}
                        className="bg-slate-50 border-slate-200 rounded h-10 text-sm placeholder:text-slate-400 placeholder:opacity-70"
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>

            {/* ═══════════════════════════════════════════
                SECTION 3: PLAYERS
            ═══════════════════════════════════════════ */}
            <div className="p-4 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
                Players
              </h2>

              <FormField
                control={form.control}
                name="players"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <UserSearchInput
                        placeholder="Search and add players..."
                        clearAfterSelect
                        onSelect={(u) => {
                          addPlayer(u);
                          field.onChange(players.map((p) => p._id));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PLAYER LIST */}
              {players.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {players.map((p, idx) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded bg-white hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">
                            {p.fullName || p.username}
                          </p>
                          <p className="text-xs text-slate-500">@{p.username}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlayer(p._id)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 border border-slate-200 rounded border-dashed">
                  <p className="text-sm">No players added yet</p>
                  <p className="text-xs mt-1">Search and add at least 2</p>
                </div>
              )}

              <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                <Info className="w-4 h-4 text-slate-600 mt-0.5" />
                <p>
                  You will be automatically assigned as the team captain.
                </p>
              </div>

              <p className="text-xs text-slate-500 text-center">
                {players.length} / 2 minimum players
              </p>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="p-4 pt-6">
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full py-6 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm uppercase tracking-wider shadow-md transition-colors"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Team...
                  </>
                ) : (
                  "Create Team"
                )}
              </Button>
            </div>
          </form>
        </Form>
          </div>
        </div>
      </main>
    </div>
  );
}
