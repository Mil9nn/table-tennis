"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AlertCircle, ArrowLeftCircle } from "lucide-react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTennisStore } from "@/hooks/useTennisStore";

const formSchema = z
  .object({
    category: z.enum(["singles", "doubles"]),
    bestOf: z.enum(["1", "3", "5", "7", "9"]),
    player1: z.string().min(1, "Player 1 username required"),
    player2: z.string().min(1, "Player 2 username required"),

    player3: z.string().optional(),
    player4: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.category === "doubles") {
        return data.player3 && data.player4;
      }
      return true;
    },
    {
      message: "All 04 players required for doubles",
      path: ["player3", "player4"],
    }
  );

export default function CreateMatchPage() {
  const router = useRouter();
  const {
    playerUsers,
    setPlayerUser,
    userSearching,
    setUserSearching,
    userErrors,
    setUserErrors,
    setBestOf,
    startNewMatch,
    resetToSetup,
    searchUser,
    setCategory,
  } = useTennisStore();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      player1: "",
      player2: "",
      category: "singles",
      bestOf: "3",
    },
  });

  const watchCategory = form.watch("category");

  // Reset store on mount
  useEffect(() => {
    resetToSetup();
  }, []);

  // ✅ Form submit handler
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!playerUsers.p1 || !playerUsers.p2) {
      alert("Both players must be registered users to start a match.");
      return;
    }

    if (values.category === "doubles" && (!playerUsers.p3 || !playerUsers.p4)) {
      alert("All four players must be registered users for doubles match.");
      return;
    }

    if (playerUsers.p1._id === playerUsers.p2._id) {
      alert("Players cannot play against themselves!");
      return;
    }

    try {
      setBestOf(parseInt(values.bestOf, 10));
      setCategory(values.category);
      startNewMatch();
      router.push("/match/play");
    } catch (error) {
      console.error("Error starting match:", error);
      alert("Error starting match. Please try again.");
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/70 backdrop-blur-md shadow-xl border border-gray-100 p-8 space-y-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeftCircle className="size-5" />
            </Button>
          </Link>

          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-800">Create a match</h2>
            <p className="text-gray-500 text-sm mt-1">
              Enter usernames of registered players
            </p>
          </div>

          {/* ✅ React Hook Form wrapper */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Player 1 */}
              <FormField
                control={form.control}
                name="player1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 1</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter player 1 username"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          searchUser(e.target.value, "p1");
                        }}
                        className={`${
                          userErrors.p1
                            ? "focus-visible:ring-red-300"
                            : playerUsers.p1
                            ? "focus-visible:ring-green-300"
                            : ""
                        }`}
                      />
                    </FormControl>
                    {userErrors.p1 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-sm text-red-500">
                          {userErrors.p1}
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Player 2 */}
              <FormField
                control={form.control}
                name="player2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 2</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter player 2 username"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          searchUser(e.target.value, "p2");
                        }}
                        className={`${
                          userErrors.p2
                            ? "focus-visible:ring-red-300"
                            : playerUsers.p2
                            ? "focus-visible:ring-green-300"
                            : ""
                        }`}
                      />
                    </FormControl>
                    {userErrors.p2 && (
                      <Alert>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-sm text-red-500">
                          {userErrors.p2}
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Player 3 - Only show for doubles */}
              {watchCategory === "doubles" && (
                <FormField
                  control={form.control}
                  name="player3"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player 3</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter player 3 username"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            searchUser(e.target.value, "p3");
                          }}
                          className={`${
                            userErrors.p3
                              ? "focus-visible:ring-red-300"
                              : playerUsers.p3
                              ? "focus-visible:ring-green-300"
                              : ""
                          }`}
                        />
                      </FormControl>
                      {userErrors.p3 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <AlertDescription className="text-sm text-red-500">
                            {userErrors.p3}
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Player 4 - Only show for doubles */}
              {watchCategory === "doubles" && (
                <FormField
                  control={form.control}
                  name="player4"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Player 4</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter player 4 username"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            searchUser(e.target.value, "p4");
                          }}
                          className={`${
                            userErrors.p4
                              ? "focus-visible:ring-red-300"
                              : playerUsers.p4
                              ? "focus-visible:ring-green-300"
                              : ""
                          }`}
                        />
                      </FormControl>
                      {userErrors.p4 && (
                        <Alert>
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          <AlertDescription className="text-sm text-red-500">
                            {userErrors.p4}
                          </AlertDescription>
                        </Alert>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex items-center gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="singles">Singles</SelectItem>
                          <SelectItem value="doubles">Doubles</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Match Format */}
                <FormField
                  control={form.control}
                  name="bestOf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Match Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Best of 1</SelectItem>
                          <SelectItem value="3">Best of 3</SelectItem>
                          <SelectItem value="5">Best of 5</SelectItem>
                          <SelectItem value="7">Best of 7</SelectItem>
                          <SelectItem value="9">Best of 9</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={
                  !playerUsers.p1 ||
                  !playerUsers.p2 ||
                  (watchCategory === "doubles" && (!playerUsers.p3 || !playerUsers.p4)) ||
                  userSearching.p1 ||
                  userSearching.p2 ||
                  (watchCategory === "doubles" && (userSearching.p3 || userSearching.p4))
                }
              >
                {!playerUsers.p1 || !playerUsers.p2
                  ? "Enter both players"
                  : watchCategory === "doubles" && (!playerUsers.p3 || !playerUsers.p4)
                  ? "Enter all four players"
                  : "Start Match"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}