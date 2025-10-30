// app/profile/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { axiosInstance } from "@/lib/axiosInstance";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserProfilePage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get(`/profile/${id}`);
      setProfileData(res.data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!profileData?.success) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const { user, stats } = profileData;

  return (
    <div className="max-w-4xl mx-auto p-2 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="">
          <div className="flex items-center gap-4">
            {user.profileImage ? (
              <Image
                src={user.profileImage}
                alt={user.fullName || user.username}
                width={80}
                height={80}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl">
                {(user.fullName?.[0] || user.username?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
              <p className="text-muted-foreground">@{user.username}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm">Total Matches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.overall.totalMatches}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.overall.totalMatches > 0
                ? Math.round((stats.overall.totalWins / stats.overall.totalMatches) * 100)
                : 0}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="">
            <CardTitle className="text-sm">Record</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats.overall.totalWins}W - {stats.overall.totalLosses}L
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Individual Matches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-medium">{stats.individual.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wins</span>
                  <span className="font-medium text-green-600">{stats.individual.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Losses</span>
                  <span className="font-medium text-red-600">{stats.individual.losses}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Team Matches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-medium">{stats.team.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Wins</span>
                  <span className="font-medium text-green-600">{stats.team.wins}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Losses</span>
                  <span className="font-medium text-red-600">{stats.team.losses}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.teams.length > 0 ? (
                <div className="space-y-2">
                  {stats.teams.map((team: any) => (
                    <div key={team._id} className="flex justify-between items-center p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{team.name}</p>
                        <p className="text-xs text-muted-foreground">{team.role}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{team.playerCount} players</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not part of any teams</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}