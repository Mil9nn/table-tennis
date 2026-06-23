"use client";

import { useParams } from "next/navigation";
import TournamentsPage from "../../tournaments/page";

export default function UserTournamentsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="min-h-screen bg-[#ffffff] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#353535]">Invalid user ID</p>
        </div>
      </div>
    );
  }

  // Pass the user ID to the tournaments page component
  // The component will handle fetching data for the specific user
  return <TournamentsPage userId={id} />;
}

