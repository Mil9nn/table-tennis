import { ArrowLeft, Share } from "@mui/icons-material";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function MatchStatsHeader({ match }: { match: any }) {
  const router = useRouter();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "Match Stats", url });
      toast.success("Match shared");
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  };

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-white border-b">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft fontSize="small" /> Back
      </Button>

      <Button variant="outline" size="sm" onClick={handleShare}>
        <Share sx={{ fontSize: 16 }} /> Share
      </Button>
    </div>
  );
}
