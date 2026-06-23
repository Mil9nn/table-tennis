"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

interface MatchSummaryProps {
  side1Name: string;
  side2Name: string;
  side1Sets: number;
  side2Sets: number;
}

export function MatchSummary({
  side1Name,
  side2Name,
  side1Sets,
  side2Sets,
}: MatchSummaryProps) {
  const isSide1Winner = side1Sets > side2Sets;
  const isSide2Winner = side2Sets > side1Sets;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="px-2">
      <div className="space-y-2">
        {/* SIDE 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[#3c6e71]/10 text-[#3c6e71] text-xs font-semibold">
                {side1Name.includes(" & ") 
                  ? side1Name.split(" & ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : side1Name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <span
              className={`truncate text-sm font-medium ${
                isSide1Winner ? "text-[#2B2F36]" : "text-[#6B7280]"
              }`}
            >
              {side1Name}
            </span>
          </div>

          <span
            className={`text-xl font-semibold tabular-nums ${
              isSide1Winner ? "text-[#3c6e71]" : "text-[#9CA3AF]"
            }`}
          >
            {side1Sets}
          </span>
        </div>

        {/* DIVIDER */}
        <div className="h-px bg-[#E6E8EB]" />

        {/* SIDE 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-[#284b63]/10 text-[#284b63] text-xs font-semibold">
                {side2Name.includes(" & ") 
                  ? side2Name.split(" & ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  : side2Name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <span
              className={`truncate text-sm font-medium ${
                isSide2Winner ? "text-[#2B2F36]" : "text-[#6B7280]"
              }`}
            >
              {side2Name}
            </span>
          </div>

          <span
            className={`text-xl font-semibold tabular-nums ${
              isSide2Winner ? "text-[#3c6e71]" : "text-[#9CA3AF]"
            }`}
          >
            {side2Sets}
          </span>
        </div>
      </div>
    </motion.section>
  );
}
