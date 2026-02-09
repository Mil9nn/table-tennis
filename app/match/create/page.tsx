"use client";

import { useState } from "react";
import IndividualMatchForm from "../componets/IndividualMatchForm";
import TeamMatchForm from "../componets/TeamMatchForm";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import WorkspacesIcon from "@mui/icons-material/Workspaces";

export default function CreateMatchPage() {
  const [matchCategory, setMatchCategory] = useState<"individual" | "team">(
    "individual"
  );
  const router = useRouter();

  const categories = [
    {
      type: "individual" as const,
      title: "Individual",
      description: "Singles / Doubles / Mixed",
      icon: PersonIcon,
    },
    {
      type: "team" as const,
      title: "Team Tie",
      description: "Club vs Club / Group",
      icon: GroupsIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* HEADER: Precise & Architectural */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-md hover:bg-muted transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <h1 className="text-sm font-semibold text-foreground">
            Create match
          </h1>
        </div>
      </header>

      <main className="mx-auto py-8">
        {/* CATEGORY SELECTOR: Consistent with Form Design */}
        <div className="mb-10 px-4">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-foreground">
              Select Category
            </h2>
            <div className="h-[1px] bg-[#d9d9d9] w-16"></div>
          </div>

          <div className="flex rounded-lg bg-muted p-1">
            {categories.map((category) => {
              const isActive = matchCategory === category.type;
              const Icon = category.icon;

              return (
                <button
                  key={category.type}
                  onClick={() => setMatchCategory(category.type)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-medium rounded-md transition-all",
                    isActive
                      ? "bg-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  />
                  <span>{category.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FORM PANEL: Seamless Integration */}
        <AnimatePresence mode="wait">
          <motion.div
            key={matchCategory}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {matchCategory === "individual" ? (
              <IndividualMatchForm endpoint="/matches/individual" />
            ) : (
              <TeamMatchForm endpoint="/matches/team" />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
