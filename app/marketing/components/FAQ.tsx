"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const FAQS = [
  {
    question: "Can I use this for casual matches with friends?",
    answer:
      "Absolutely. Free tier includes unlimited match participation. Perfect for casual play, training, and friendly competition.",
  },
  {
    question: "What if I want to run a large tournament with 100+ players?",
    answer:
      "Pro tier supports up to 50 participants per tournament. For larger events, you can create multiple tournaments or contact us for enterprise solutions.",
  },
  {
    question: "Can multiple people score the same match?",
    answer:
      "Yes. Pro tier allows up to 3 scorers per tournament. Scorers can be assistants or co-managers.",
  },
  {
    question: "Are my statistics accurate?",
    answer:
      "Yes. All calculations follow ITTF rules. Every point, set, and match is calculated based on live data, not estimates.",
  },
  {
    question: "What formats can I run?",
    answer:
      "Free tier: round-robin only. Pro+: round-robin, knockout, and hybrid (multi-phase) formats.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Pro tier and above. Export match history, statistics, and tournament results in CSV/PDF formats.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="marketing py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Questions? We Have Answers
          </h2>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden hover:border-white/20 transition-colors"
            >
              <button
                onClick={() =>
                  setOpenIndex(openIndex === i ? null : i)
                }
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <span className="text-left font-semibold text-white">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-white/60 flex-shrink-0 ml-4" />
                </motion.div>
              </button>

              {openIndex === i && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-white/10 px-6 py-4 bg-white/5"
                >
                  <p className="text-sm text-white/70 leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
