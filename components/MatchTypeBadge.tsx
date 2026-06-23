import React from "react";
import { User, Users, HeartHandshake } from "lucide-react";

export type MatchType = "singles" | "doubles";

type Props = React.ComponentProps<"span"> & {
  type: MatchType;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
};

const TYPE_CONFIG: Record<MatchType, { label: string; icon: React.ElementType; className: string }> = {
  singles: {
    label: "Singles",
    icon: User,
    className: "text-[#3c6e71] dark:text-[#3c6e71]",
  },
  doubles: {
    label: "Doubles",
    icon: Users,
    className: "text-[#284b63] dark:text-[#284b63]",
  },
};

const SIZE_MAP: Record<NonNullable<Props["size"]>, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export default function MatchTypeBadge({ type, size = "sm", showIcon = false, className = "", ...props }: Props) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.icon;

  return (
    <span
      {...props}
      className={`${SIZE_MAP[size]} inline-flex items-center gap-2 rounded-lg font-medium transition-colors ${cfg.className} ${className}`}
      aria-label={`Match type: ${cfg.label}`}
      title={cfg.label}
    >
      {showIcon ? (
        <span className="inline-flex -ml-0.5">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      ) : null}

      <span className="whitespace-nowrap">{cfg.label}</span>
    </span>
  );
}

/*
Usage examples:

<MatchTypeBadge type="singles" />
<MatchTypeBadge type="doubles" size="sm" />

Notes:
- This expects shadcn's Badge component at `@/components/ui/badge` and lucide-react installed.
- You can adjust color palettes or icon choices to better fit your design.
*/
