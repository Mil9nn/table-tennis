"use client";

import { useParams } from "next/navigation";
import InsightsPage from "../../insights/page";

export default function UserInsightsPage() {
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

  return <InsightsPage userId={id} />;
}

