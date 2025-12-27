"use client";

import { X, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  title?: string;
  description?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  feature,
  title = "Unlock Advanced Analytics",
  description,
}: UpgradeModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onOpenChange(false);
    router.push("/subscription?feature=" + (feature || "general"));
  };

  const features = [
    "Complete match analysis with detailed shot placement",
    "Full weakness analysis and improvement recommendations",
    "Advanced heatmaps and wagon wheel visualizations",
    "Per-player shot breakdowns and statistics",
    "Export match data (CSV/PDF)",
    "Unlimited match history",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#353535]">
            {title}
          </DialogTitle>
          <DialogDescription className="text-[#353535]/70">
            {description || "Upgrade to Pro to unlock advanced analytics and insights"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Features List */}
          <div className="space-y-3">
            <h4 className="font-semibold text-[#353535]">What you'll get:</h4>
            <ul className="space-y-2">
              {features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-[#3c6e71] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-[#353535]">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing */}
          <div className="bg-[#f5f5f5] p-4 rounded-lg border border-[#d9d9d9]">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-[#353535]">₹69</span>
              <span className="text-sm text-[#353535]/70">/month</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold text-[#353535]">₹350</span>
              <span className="text-sm text-[#353535]/70">/year</span>
              <span className="text-xs text-[#3c6e71] ml-2">Save 17%</span>
            </div>
            <p className="text-xs text-[#353535]/60 mt-2">
              Cancel anytime
            </p>
          </div>

        </div>

        {/* CTA Buttons */}
        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleUpgrade}
            className="w-full bg-[#3c6e71] hover:bg-[#3c6e71]/90 text-white h-12 text-base"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Upgrade to Pro
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full border-[#d9d9d9] text-[#353535] hover:bg-[#f5f5f5]"
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

