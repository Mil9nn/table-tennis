"use client";

import React from "react";

const ProfileHeaderSkeleton = () => {
  return (
    <div className="bg-white shadow-sm border border-gray-100 p-6 animate-pulse">
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Profile Image Skeleton */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full border-4 border-blue-100 bg-gray-200" />
        </div>

        {/* Text Info Skeleton */}
        <div className="flex-1 space-y-4 text-center md:text-left">
          {/* Name + Gender */}
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <div className="h-6 w-40 bg-gray-200 rounded"></div>
            <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
          </div>

          {/* Username */}
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto md:mx-0"></div>

          {/* Email */}
          <div className="h-4 w-52 bg-gray-200 rounded mx-auto md:mx-0"></div>

          {/* Date */}
          <div className="h-3 w-40 bg-gray-200 rounded mx-auto md:mx-0"></div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeaderSkeleton;
