"use client";

import { useParams } from "next/navigation";
import { ProfilePageContent } from "../page";

export default function UserProfilePage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  // Guard against undefined or missing user id
  if (!id) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#353535]">Invalid user ID</p>
        </div>
      </div>
    );
  }

  // Pass the id to the shared profile implementation
  return <ProfilePageContent userId={id} />;
}
