import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, Users, HeartHandshake } from "lucide-react";

export type MatchType = "singles" | "doubles" | "mixed_doubles";

type Props = React.ComponentProps<typeof Badge> & {
  type: MatchType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
};

const TYPE_CONFIG: Record<MatchType, { label: string; icon: React.ElementType; className: string }> = {
  singles: {
    label: "Singles",
    icon: User,
    className: "bg-purple-50 text-purple-800 ring-2 ring-purple-100",
  },
  doubles: {
    label: "Doubles",
    icon: Users,
    className: "bg-cyan-50 text-cyan-800 ring-2 ring-cyan-100",
  },
  mixed_doubles: {
    label: "Mixed Doubles",
    icon: HeartHandshake,
    className: "bg-pink-50 text-pink-800 ring-2 ring-pink-100",
  },
};

const SIZE_MAP: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function MatchTypeBadge({ type, size = "md", showIcon = true, className = "", ...props }: Props) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <Badge
      {...props}
      className={`${SIZE_MAP[size]} inline-flex items-center gap-2 rounded-full font-medium ${cfg.className} ${className}`}
      aria-label={`Match type: ${cfg.label}`}
      title={cfg.label}
    >
      {showIcon ? (
        <span className="inline-flex -ml-0.5">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      ) : null}

      <span className="whitespace-nowrap">{cfg.label}</span>
    </Badge>
  );
}

/*
Usage examples:

<MatchTypeBadge type="singles" />
<MatchTypeBadge type="doubles" size="sm" />
<MatchTypeBadge type="mixed_doubles" showIcon={false} />

Notes:
- This expects shadcn's Badge component at `@/components/ui/badge` and lucide-react installed.
- You can adjust color palettes or icon choices to better fit your design.
*/
