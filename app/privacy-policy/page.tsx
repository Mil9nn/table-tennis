"use client";

import Link from "next/link";
import { Shield, ArrowLeft, Lock, Eye, Database, UserCheck, Bell, Trash2, Globe, Mail } from "lucide-react";
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

export default function PrivacyPolicyPage() {
  const lastUpdated = "December 27, 2024";

  const sections = [
    {
      icon: Database,
      title: "Information We Collect",
      content: [
        {
          subtitle: "Account Information",
          text: "When you create an account, we collect your email address, username, full name, and optional profile information such as your profile picture and playing preferences."
        },
        {
          subtitle: "Match & Performance Data",
          text: "We collect data about your table tennis matches including scores, shot statistics, match outcomes, and performance analytics. This data is used to provide insights and improve your game."
        },
        {
          subtitle: "Usage Information",
          text: "We automatically collect information about how you interact with our service, including pages visited, features used, and time spent on the platform."
        },
        {
          subtitle: "Device Information",
          text: "We may collect device identifiers, browser type, operating system, and IP address for security and service optimization purposes."
        }
      ]
    },
    {
      icon: Eye,
      title: "How We Use Your Information",
      content: [
        {
          subtitle: "Provide Our Services",
          text: "We use your information to operate and maintain TTPro, including match scoring, statistics tracking, tournament management, and leaderboard features."
        },
        {
          subtitle: "Improve & Personalize",
          text: "Your usage data helps us understand how to improve our platform and provide personalized recommendations based on your playing style and preferences."
        },
        {
          subtitle: "Communication",
          text: "We may send you service-related announcements, updates about new features, and promotional content (which you can opt out of at any time)."
        },
        {
          subtitle: "Security & Fraud Prevention",
          text: "We use information to protect our users and platform from unauthorized access, abuse, and fraudulent activity."
        }
      ]
    },
    {
      icon: UserCheck,
      title: "Information Sharing",
      content: [
        {
          subtitle: "Public Profile Data",
          text: "Your username, profile picture, and match statistics may be visible to other users through leaderboards, public matches, and tournament brackets as part of the service functionality."
        },
        {
          subtitle: "Service Providers",
          text: "We work with trusted third-party services for hosting, analytics, payment processing, and email delivery. These providers only access data necessary to perform their services."
        },
        {
          subtitle: "Legal Requirements",
          text: "We may disclose information when required by law, to protect our rights, or in response to valid legal requests from public authorities."
        },
        {
          subtitle: "No Sale of Data",
          text: "We do not sell your personal information to third parties for marketing or advertising purposes."
        }
      ]
    },
    {
      icon: Lock,
      title: "Data Security",
      content: [
        {
          subtitle: "Encryption",
          text: "We use industry-standard encryption protocols (TLS/SSL) to protect data transmitted between your device and our servers."
        },
        {
          subtitle: "Secure Storage",
          text: "Your data is stored on secure servers with access controls, regular security audits, and monitoring for unauthorized access attempts."
        },
        {
          subtitle: "Password Protection",
          text: "Your account password is hashed using secure algorithms. We never store passwords in plain text."
        }
      ]
    },
    {
      icon: Bell,
      title: "Your Rights & Choices",
      content: [
        {
          subtitle: "Access & Portability",
          text: "You can access your personal information through your profile settings. You may request a copy of your data in a portable format."
        },
        {
          subtitle: "Correction",
          text: "You can update or correct your account information at any time through your profile settings."
        },
        {
          subtitle: "Deletion",
          text: "You may request deletion of your account and associated data. Some data may be retained for legal compliance or legitimate business purposes."
        },
        {
          subtitle: "Marketing Opt-Out",
          text: "You can unsubscribe from promotional emails by clicking the unsubscribe link in any marketing message or updating your notification preferences."
        }
      ]
    },
    {
      icon: Globe,
      title: "Cookies & Tracking",
      content: [
        {
          subtitle: "Essential Cookies",
          text: "We use cookies necessary for the platform to function, such as authentication tokens and session management."
        },
        {
          subtitle: "Analytics",
          text: "We use analytics tools to understand how users interact with our platform. This helps us improve user experience and identify issues."
        },
        {
          subtitle: "Your Choices",
          text: "Most browsers allow you to control cookies through their settings. Note that disabling certain cookies may affect platform functionality."
        }
      ]
    },
    {
      icon: Trash2,
      title: "Data Retention",
      content: [
        {
          subtitle: "Active Accounts",
          text: "We retain your data while your account is active to provide our services and maintain your match history and statistics."
        },
        {
          subtitle: "Deleted Accounts",
          text: "When you delete your account, we remove your personal information within 30 days, except where retention is required for legal compliance."
        },
        {
          subtitle: "Anonymized Data",
          text: "We may retain anonymized, aggregated data that cannot be used to identify you for research and service improvement purposes."
        }
      ]
    }
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
              <Shield className="w-8 h-8" style={{ color: "#3c6e71" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Privacy Policy
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Your privacy matters to us. This policy explains how TTPro collects, uses, and protects your personal information.
            </p>
            <p className="text-white/40 text-sm mt-4">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            variants={staggerChildren}
            initial="initial"
            animate="animate"
            className="space-y-8"
          >
            {sections.map((section, sectionIndex) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={sectionIndex}
                  variants={fadeInUp}
                  className="rounded-2xl p-6 md:p-8"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                      <Icon className="w-5 h-5" style={{ color: "#3c6e71" }} />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {section.title}
                    </h2>
                  </div>
                  <div className="space-y-5 pl-14">
                    {section.content.map((item, itemIndex) => (
                      <div key={itemIndex}>
                        <h3 className="text-white font-medium mb-2">{item.subtitle}</h3>
                        <p className="text-white/60 leading-relaxed">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}

            {/* Contact Section */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8 text-center"
              style={{ backgroundColor: "rgba(60, 110, 113, 0.1)", border: "1px solid rgba(60, 110, 113, 0.2)" }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: "rgba(60, 110, 113, 0.2)" }}>
                <Mail className="w-6 h-6" style={{ color: "#3c6e71" }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Questions About Privacy?
              </h2>
              <p className="text-white/60 mb-4 max-w-xl mx-auto">
                If you have any questions about this Privacy Policy or how we handle your data, please don&apos;t hesitate to reach out.
              </p>
              <a
                href="mailto:app.ttpro@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: "#3c6e71", color: "white" }}
              >
                <Mail className="w-4 h-4" />
                Contact Us
              </a>
            </motion.div>

            {/* Legal Notice */}
            <motion.div
              variants={fadeInUp}
              className="text-center pt-8 border-t"
              style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <p className="text-white/40 text-sm">
                By using TTPro, you agree to this Privacy Policy. We may update this policy periodically, and will notify you of significant changes through the platform or via email.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

