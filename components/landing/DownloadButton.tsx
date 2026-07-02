import Link from "next/link";
import { Download } from "lucide-react";
import { CTA_LINKS } from "@/lib/landing/site";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DownloadButtonProps = {
  size?: "default" | "sm" | "lg";
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  showIcon?: boolean;
};

export function DownloadButton({
  size = "default",
  variant = "primary",
  className,
  showIcon = true,
}: DownloadButtonProps) {
  const isLarge = size === "lg";

  return (
    <Button
      asChild
      size={size}
      variant={variant === "outline" ? "outline" : variant === "ghost" ? "ghost" : "default"}
      className={cn(
        variant === "primary" &&
          "rounded-full bg-[var(--lp-accent)] font-semibold text-[var(--lp-on-accent)] hover:bg-[var(--lp-accent-hover)]",
        variant === "outline" &&
          "rounded-full border-[var(--lp-border)] bg-transparent text-[var(--lp-text)] hover:bg-[var(--lp-hover)]",
        variant === "ghost" &&
          "text-[var(--lp-text-muted)] hover:bg-[var(--lp-hover)] hover:text-[var(--lp-text)]",
        isLarge && "h-12 px-7 text-base",
        !isLarge && variant === "primary" && "rounded-full px-5",
        className
      )}
    >
      <Link
        href={CTA_LINKS.download}
        target="_blank"
        rel="noopener noreferrer"
      >
        {showIcon && <Download className="size-4" aria-hidden="true" />}
        Download on Google Play
      </Link>
    </Button>
  );
}
