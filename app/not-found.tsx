import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-8xl font-bold text-indigo-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-900 mb-2">
        Page Not Found
      </h2>
      <p className="text-slate-600 mb-8 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </Button>
        <Button asChild>
          <Link href="/matches">
            <ArrowLeft className="w-4 h-4 mr-2" />
            View Matches
          </Link>
        </Button>
      </div>
    </div>
  );
}



































