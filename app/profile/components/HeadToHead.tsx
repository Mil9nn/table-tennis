// app/profile/components/HeadToHead.tsx
"use client";

import Image from "next/image";

interface HeadToHeadProps {
  detailedStats: any;
}

const HeadToHead = ({ detailedStats }: HeadToHeadProps) => {
  if (!detailedStats?.headToHead?.length) return null;

  return (
    <div className="bg-white p-4">
      <h3 className="text-lg font-medium text-gray-800 mb-4">Head-to-Head Records</h3>
      <div className="space-y-2">
        {detailedStats.headToHead.map((h: any) => (
          <div key={h.opponent._id} className="flex items-center justify-between p-2 bg-gray-100 rounded-md">
            <div className="flex items-center gap-2">
              {h.opponent.profileImage && (
                <Image
                  src={h.opponent.profileImage}
                  alt={h.opponent.fullName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="font-semibold text-sm">{h.opponent.fullName}</p>
                <p className="text-xs text-gray-600">@{h.opponent.username}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800">
                {h.wins}-{h.losses}
              </p>
              <p className="text-xs text-gray-600">{h.winRate}% Win Rate</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeadToHead;