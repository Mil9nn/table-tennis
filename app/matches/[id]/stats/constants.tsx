import { BarChart3, FileText, FileSearch, Layers } from "lucide-react";
import { Section } from "@/components/match-stats/SectionNavigation";

export const SECTIONS: Section[] = [
  { id: "overview", label: "Overview", icon: <FileText className="h-4 w-4" /> },
  { id: "performance", label: "Performance", icon: <BarChart3 className="h-4 w-4" /> },
  { id: "details", label: "Details", icon: <FileSearch className="h-4 w-4" /> },
  { id: "maps", label: "Maps", icon: <Layers className="h-4 w-4" /> },
];

