"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/landing/schema";
import { SectionHeading, SectionLabel, SectionLead, SectionShell } from "./Section";
import { FadeIn } from "./motion";

export function FAQSection() {
  return (
    <SectionShell id="faq" ariaLabelledBy="faq-heading">
      <FadeIn className="mx-auto max-w-3xl text-center">
        <SectionLabel>FAQ</SectionLabel>
        <SectionHeading id="faq-heading" className="mt-3">
          Table tennis scoring & tournament questions
        </SectionHeading>
        <SectionLead className="mx-auto mt-4">
          Everything you need to know about TTPro—the table tennis scoring app,
          tournament manager, and team match platform.
        </SectionLead>
      </FadeIn>

      <FadeIn className="mx-auto mt-12 max-w-3xl">
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, i) => (
            <AccordionItem
              key={item.question}
              value={`faq-${i}`}
              className="border-[var(--lp-border)]"
            >
              <AccordionTrigger className="text-left text-base font-medium text-[var(--lp-text)] hover:text-[var(--lp-accent)] hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-[var(--lp-text-muted)]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </FadeIn>
    </SectionShell>
  );
}
