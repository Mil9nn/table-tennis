"use client";

import { useState } from "react";
import IndividualMatchForm from "../componets/IndividualMatchForm";
import TeamMatchForm from "../componets/TeamMatchForm";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

import PersonIcon from '@mui/icons-material/Person';
import GroupsIcon from '@mui/icons-material/Groups';
import WorkspacesIcon from '@mui/icons-material/Workspaces';

export default function CreateMatchPage() {
  const [matchCategory, setMatchCategory] = useState<"individual" | "team">("individual");
  const router = useRouter();

  const categories = [
    {
      type: "individual" as const,
      title: "Individual",
      description: "Singles / Doubles / Mixed",
      icon: PersonIcon
    },
    {
      type: "team" as const,
      title: "Team Tie",
      description: "Club vs Club / Group",
      icon: GroupsIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* HEADER: Precise & Architectural */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-[0.2em] text-slate-900 leading-none">
                Match Creation
              </h1>
              <p></p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto px-4 py-8">
        {/* CATEGORY SELECTOR: High Density Toggle */}
        <div className="mb-10">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600 px-2">
              Select Category
            </h2>
            <div className="h-px bg-slate-100 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => {
              const isActive = matchCategory === category.type;
              const Icon = category.icon;

              return (
                <button
                  key={category.type}
                  onClick={() => setMatchCategory(category.type)}
                  className={cn(
                    "relative group p-4 rounded border transition-all duration-200 text-left overflow-hidden",
                    isActive
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-400"
                  )}
                >
                  <div className="flex flex-col h-full justify-between gap-4">
                    <div className="flex justify-between items-start">
                      <Icon className={cn("w-5 h-5", isActive ? "text-slate-300" : "text-slate-600")} />
                      {isActive && (
                        <motion.div layoutId="arrow" className="text-white">
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest leading-none mb-1">
                        {category.title}
                      </h3>
                      <p className={cn("text-xs tracking-tight", isActive ? "text-slate-600" : "text-slate-500")}>
                        {category.description}
                      </p>
                    </div>
                  </div>
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
            className="border border-slate-100 rounded-lg p-1 sm:p-2 bg-slate-50/30"
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