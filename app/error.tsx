"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Something went wrong!
      </h2>
      <p className="text-slate-600 mb-6 text-center max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}



