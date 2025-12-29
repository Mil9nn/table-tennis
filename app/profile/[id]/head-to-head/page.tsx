"use client";

import { useParams } from "next/navigation";
import HeadToHeadPage from "../../head-to-head/page";

export default function UserHeadToHeadPage() {
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

  return <HeadToHeadPage userId={id} />;
}

