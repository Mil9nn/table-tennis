"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface BlurredContentProps {
  children: React.ReactNode;
  feature?: string;
  title?: string;
  description?: string;
  previewLines?: number; // Number of lines/elements to show before blur
}

export function BlurredContent({
  children,
  feature,
  title,
  description,
  previewLines = 2,
}: BlurredContentProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setShowModal(true)}>
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-[#3c6e71]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6 text-[#3c6e71]" />
            </div>
            <p className="text-sm font-semibold text-[#353535] mb-1">
              Unlock with Pro
            </p>
            <p className="text-xs text-[#353535]/70">
              Click to upgrade and view full content
            </p>
          </div>
        </div>
        <div className="absolute top-2 right-2 bg-[#3c6e71] text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Pro</span>
        </div>
      </div>

      <UpgradeModal
        open={showModal}
        onOpenChange={setShowModal}
        feature={feature}
        title={title}
        description={description}
      />
    </>
  );
}

