"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Mail, 
  ArrowLeft, 
  MessageSquare, 
  HelpCircle, 
  Bug, 
  Lightbulb,
  Clock,
  MapPin,
  Send,
  CheckCircle,
  Twitter,
  Github
} from "lucide-react";
import { motion } from "framer-motion";
import MarketingFooter from "../marketing/components/MarketingFooter";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "general",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "general", message: "" });
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help with your account or technical issues",
      contact: "app.ttpro@gmail.com",
      href: "mailto:app.ttpro@gmail.com"
    },
    {
      icon: HelpCircle,
      title: "General Inquiries",
      description: "Questions about TTPro or partnerships",
      contact: "app.ttpro@gmail.com",
      href: "mailto:app.ttpro@gmail.com"
    },
    {
      icon: Bug,
      title: "Report a Bug",
      description: "Found something broken? Let us know",
      contact: "app.ttpro@gmail.com",
      href: "mailto:app.ttpro@gmail.com?subject=Bug%20Report"
    },
    {
      icon: Lightbulb,
      title: "Feature Requests",
      description: "Share your ideas to improve TTPro",
      contact: "app.ttpro@gmail.com",
      href: "mailto:app.ttpro@gmail.com?subject=Feature%20Request"
    }
  ];

  const subjectOptions = [
    { value: "general", label: "General Inquiry" },
    { value: "support", label: "Technical Support" },
    { value: "billing", label: "Billing & Subscriptions" },
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "partnership", label: "Partnership Opportunity" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="marketing min-h-screen" style={{ backgroundColor: "#353535" }}>
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link
              href="/marketing"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ backgroundColor: "rgba(60, 110, 113, 0.2)" }}>
              <MessageSquare className="w-8 h-8" style={{ color: "#3c6e71" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Contact Us
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Have a question, feedback, or need support? We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.a
                  key={index}
                  href={method.href}
                  variants={fadeInUp}
                  className="group rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]"
                  style={{ 
                    backgroundColor: "rgba(255, 255, 255, 0.03)", 
                    border: "1px solid rgba(255, 255, 255, 0.08)" 
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                    <Icon className="w-5 h-5" style={{ color: "#3c6e71" }} />
                  </div>
                  <h3 className="text-white font-semibold mb-1">{method.title}</h3>
                  <p className="text-white/50 text-sm mb-3">{method.description}</p>
                  <span className="text-sm font-medium group-hover:underline" style={{ color: "#3c6e71" }}>
                    {method.contact}
                  </span>
                </motion.a>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3 rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <h2 className="text-xl font-semibold text-white mb-6" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Send us a Message
              </h2>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Message Sent!</h3>
                  <p className="text-white/60 mb-6">Thank you for reaching out. We&apos;ll get back to you within 24-48 hours.</p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#3c6e71" }}
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Your Name</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#3c6e71] transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm font-medium mb-2">Email Address</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#3c6e71] transition-colors"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#3c6e71] transition-colors appearance-none cursor-pointer"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6,9 12,15 18,9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                    >
                      {subjectOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[#353535]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/70 text-sm font-medium mb-2">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#3c6e71] transition-colors resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    style={{ backgroundColor: "#3c6e71", color: "white" }}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Response Time */}
              <div 
                className="rounded-2xl p-6"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                    <Clock className="w-5 h-5" style={{ color: "#3c6e71" }} />
                  </div>
                  <h3 className="text-white font-semibold">Response Time</h3>
                </div>
                <p className="text-white/60 text-sm">
                  We typically respond within <span className="text-white font-medium">24-48 hours</span> during business days. For urgent issues, please include &quot;URGENT&quot; in your subject line.
                </p>
              </div>

              {/* Location */}
              <div 
                className="rounded-2xl p-6"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                    <MapPin className="w-5 h-5" style={{ color: "#3c6e71" }} />
                  </div>
                  <h3 className="text-white font-semibold">Our Location</h3>
                </div>
                <p className="text-white/60 text-sm">
                  TTPro operates as a fully remote team, serving table tennis enthusiasts worldwide.
                </p>
              </div>

              {/* Social Links */}
              <div 
                className="rounded-2xl p-6"
                style={{ backgroundColor: "rgba(60, 110, 113, 0.1)", border: "1px solid rgba(60, 110, 113, 0.2)" }}
              >
                <h3 className="text-white font-semibold mb-4">Connect With Us</h3>
                <div className="flex gap-3">
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Github className="w-5 h-5" />
                  </a>
                  <a
                    href="mailto:app.ttpro@gmail.com"
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

