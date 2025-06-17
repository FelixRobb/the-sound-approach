import { Book } from "lucide-react";
import { PageBadgeProps } from "@/types";
import { cn } from "@/lib/utils";

export default function PageBadge({ page, className }: PageBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1",
        "bg-gray-100 dark:bg-gray-800 rounded-md",
        "text-xs font-medium text-gray-600 dark:text-gray-400",
        className
      )}
    >
      <Book size={12} />
      <span>Page {page}</span>
    </div>
  );
}
