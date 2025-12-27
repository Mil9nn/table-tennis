import { BarChart3 } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title?: string;
  description?: string;
}

export function EmptyState({
  icon: Icon = BarChart3,
  title = "No data yet",
  description = "Activity will appear here once available.",
}: EmptyStateProps) {
  return (
    <div
      className="
        flex flex-col items-center justify-center
        border border-[#E6E8EB]
        bg-[#F9FAFB]
        px-6 py-8
        text-center
        transition-opacity duration-300
        animate-fade-in
      "
    >
      <Icon
        className="
          h-6 w-6
          text-[#3B82F6]
          mb-2
          transition-transform duration-300
        "
      />

      <p className="text-sm font-medium text-[#2B2F36] leading-tight">
        {title}
      </p>

      <p className="mt-0.5 text-xs text-[#2B2F36]/70">
        {description}
      </p>
    </div>
  );
}
