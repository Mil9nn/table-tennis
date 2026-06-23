import { Facebook, Instagram } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/landing/site";
import { cn } from "@/lib/utils";

const SOCIAL_CONFIG = {
  facebook: { Icon: Facebook, label: "TTPro on Facebook" },
  instagram: { Icon: Instagram, label: "TTPro on Instagram" },
} as const satisfies Record<
  keyof typeof SOCIAL_LINKS,
  { Icon: typeof Facebook; label: string }
>;

type SocialLinksProps = {
  className?: string;
  linkClassName?: string;
};

export function SocialLinks({ className, linkClassName }: SocialLinksProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {(Object.keys(SOCIAL_LINKS) as (keyof typeof SOCIAL_LINKS)[]).map((key) => {
        const { Icon, label } = SOCIAL_CONFIG[key];
        return (
          <a
            key={key}
            href={SOCIAL_LINKS[key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className={cn(
              "text-[var(--lp-text-muted)] transition hover:text-[var(--lp-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lp-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lp-surface)]",
              linkClassName
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </a>
        );
      })}
    </div>
  );
}
