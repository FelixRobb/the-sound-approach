import { Book } from "lucide-react";

import { Badge } from "./ui/badge";

type PageBadgeProps = {
  page: number | string;
  className?: string;
};

export default function PageBadge({ page, className }: PageBadgeProps) {
  return (
    <Badge variant="outline" className={className}>
      <Book className="w-3 h-3 mr-1" />
      Page {page}
    </Badge>
  );
}
