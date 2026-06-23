"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { OPERATOR_NOTE, SUPPORT_EMAIL } from "@/lib/landing/site";
import { ContentPageLayout } from "../ContentPageLayout";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "general", message: "" });
  };

  const subjectOptions = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing & Subscriptions" },
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "partnership", label: "Partnership Opportunity" },
    { value: "other", label: "Other" },
  ];

  const inputClass =
    "w-full border-b border-neutral-200 bg-transparent pb-2 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900";

  return (
    <ContentPageLayout
      title="Contact"
      description="Questions, feedback, bug reports, or partnership inquiries—we usually reply within 24–48 hours on business days."
    >
      <div className="grid gap-12 lg:grid-cols-[1fr_220px]">
        <div>
          {isSubmitted ? (
            <div>
              <CheckCircle className="mb-3 h-6 w-6 text-green-600" />
              <h2 className="text-lg font-semibold text-neutral-900">Message sent</h2>
              <p className="mt-2 text-[15px] leading-7 text-neutral-600">
                Thanks for reaching out. We&apos;ll respond as soon as possible.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-4 text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Your name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-neutral-700">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className={inputClass}
                >
                  {subjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-700">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="How can we help?"
                  className={`${inputClass} resize-none`}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send message
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-6 text-sm">
          <div>
            <p className="font-medium text-neutral-900">Email</p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-1 block text-neutral-600 underline underline-offset-2 hover:text-neutral-900"
            >
              {SUPPORT_EMAIL}
            </a>
          </div>
          <div>
            <p className="font-medium text-neutral-900">About TTPro</p>
            <p className="mt-2 leading-6 text-neutral-600">{OPERATOR_NOTE}</p>
          </div>
        </aside>
      </div>
    </ContentPageLayout>
  );
}
