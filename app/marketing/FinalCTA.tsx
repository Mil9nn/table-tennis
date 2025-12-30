"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function FinalCTA() {
  return (
    <section className="marketing relative py-20 sm:py-32 px-4 sm:px-6 overflow-hidden">
       {/* Background gradient */}
       <div className="absolute inset-0 -z-10">
         <div className="absolute inset-0 blur-3xl" style={{ background: "radial-gradient(circle, rgba(60, 110, 113, 0.1), transparent)" }} />
       </div>

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-block mb-6"
          >
            <Sparkles className="w-12 h-12" style={{ color: "var(--brand-teal, #3c6e71)" }} />
          </motion.div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-4 leading-tight">
            Ready to Track Every Point?
          </h2>

          {/* Subheadline */}
          <p className="text-sm sm:text-base text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Start scoring today. Free forever on the Basic plan.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/auth/register"
              className="group px-8 py-4 rounded-lg text-white font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 w-full sm:w-auto justify-center"
              style={{ backgroundColor: "var(--brand-teal, #3c6e71)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-dark-blue, #284b63)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--brand-teal, #3c6e71)")}
            >
              Start Scoring Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/subscription"
              className="px-8 py-4 rounded-lg border-2 font-semibold transition-all duration-300 backdrop-blur-xl w-full sm:w-auto"
              style={{ borderColor: "var(--brand-teal, #3c6e71)", color: "var(--brand-teal, #3c6e71)" }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--brand-teal, #3c6e71)"; e.currentTarget.style.color = "white"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--brand-teal, #3c6e71)"; }}
            >
              View Plans
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
