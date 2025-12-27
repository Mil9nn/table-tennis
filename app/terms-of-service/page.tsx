"use client";

import Link from "next/link";
import { FileText, ArrowLeft, Scale, Users, AlertTriangle, CreditCard, Ban, RefreshCw, Gavel, Mail } from "lucide-react";
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

export default function TermsOfServicePage() {
  const lastUpdated = "December 27, 2024";

  const sections = [
    {
      icon: Scale,
      title: "Agreement to Terms",
      content: [
        {
          subtitle: "Acceptance",
          text: "By accessing or using TTPro, you agree to be bound by these Terms of Service and our Privacy Policy. If you disagree with any part of the terms, you may not access the service."
        },
        {
          subtitle: "Eligibility",
          text: "You must be at least 13 years old to use TTPro. If you are under 18, you represent that you have your parent's or guardian's permission to use the service."
        },
        {
          subtitle: "Account Registration",
          text: "To access certain features, you must register for an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate."
        }
      ]
    },
    {
      icon: Users,
      title: "User Conduct",
      content: [
        {
          subtitle: "Acceptable Use",
          text: "You agree to use TTPro only for lawful purposes and in accordance with these Terms. You agree not to use the service in any way that could damage, disable, overburden, or impair the service."
        },
        {
          subtitle: "Prohibited Activities",
          text: "You may not: attempt to gain unauthorized access to other user accounts; interfere with other users' enjoyment of the service; submit false or misleading information; use the service for any commercial purpose without our consent."
        },
        {
          subtitle: "Fair Play",
          text: "When using match scoring and tournament features, you agree to report accurate scores and statistics. Manipulation of scores or statistics to gain unfair advantages on leaderboards is prohibited."
        },
        {
          subtitle: "Community Standards",
          text: "You agree not to post, upload, or share content that is offensive, harassing, threatening, or otherwise objectionable. We reserve the right to remove such content and suspend accounts that violate these standards."
        }
      ]
    },
    {
      icon: FileText,
      title: "Intellectual Property",
      content: [
        {
          subtitle: "Our Content",
          text: "The TTPro platform, including its design, features, content, and code, is owned by us and protected by copyright, trademark, and other intellectual property laws."
        },
        {
          subtitle: "Your Content",
          text: "You retain ownership of content you create through the service, such as match data and team information. By using our service, you grant us a license to use, store, and display this content as necessary to provide the service."
        },
        {
          subtitle: "Feedback",
          text: "If you provide us with feedback, suggestions, or ideas, you grant us the right to use such feedback without restriction or compensation to you."
        }
      ]
    },
    {
      icon: CreditCard,
      title: "Subscriptions & Payments",
      content: [
        {
          subtitle: "Free & Paid Features",
          text: "TTPro offers both free and premium subscription plans. Some features are only available to premium subscribers."
        },
        {
          subtitle: "Billing",
          text: "If you purchase a subscription, you agree to pay all applicable fees. Subscriptions automatically renew unless cancelled before the renewal date."
        },
        {
          subtitle: "Cancellation",
          text: "You may cancel your subscription at any time through your account settings. Cancellation will take effect at the end of the current billing period."
        },
        {
          subtitle: "Refunds",
          text: "Refunds are provided at our discretion. If you believe you are entitled to a refund, please contact our support team within 7 days of the charge."
        }
      ]
    },
    {
      icon: AlertTriangle,
      title: "Disclaimers",
      content: [
        {
          subtitle: "Service Availability",
          text: "We strive to keep TTPro available and functioning properly, but we do not guarantee uninterrupted access. The service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control."
        },
        {
          subtitle: "No Warranty",
          text: "TTPro is provided 'as is' and 'as available' without warranties of any kind, either express or implied. We do not warrant that the service will meet your specific requirements or expectations."
        },
        {
          subtitle: "Accuracy",
          text: "While we strive for accuracy, we do not guarantee that match statistics, rankings, or other data displayed on the platform are error-free."
        }
      ]
    },
    {
      icon: Ban,
      title: "Limitation of Liability",
      content: [
        {
          subtitle: "Exclusion of Damages",
          text: "To the maximum extent permitted by law, TTPro shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service."
        },
        {
          subtitle: "Cap on Liability",
          text: "Our total liability to you for any claims arising from or related to the service shall not exceed the amount you paid us, if any, for accessing the service in the 12 months preceding the claim."
        }
      ]
    },
    {
      icon: RefreshCw,
      title: "Changes to Terms",
      content: [
        {
          subtitle: "Modifications",
          text: "We reserve the right to modify these Terms at any time. We will provide notice of significant changes through the platform or via email."
        },
        {
          subtitle: "Continued Use",
          text: "Your continued use of TTPro after any changes to the Terms constitutes your acceptance of the new Terms."
        }
      ]
    },
    {
      icon: Gavel,
      title: "Termination",
      content: [
        {
          subtitle: "Account Termination",
          text: "You may terminate your account at any time by contacting us or using account settings. We reserve the right to suspend or terminate your account for violations of these Terms."
        },
        {
          subtitle: "Effect of Termination",
          text: "Upon termination, your right to use the service will immediately cease. Provisions of these Terms that should survive termination will remain in effect."
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
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6" style={{ backgroundColor: "rgba(40, 75, 99, 0.2)" }}>
              <FileText className="w-8 h-8" style={{ color: "#284b63" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Terms of Service
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Please read these terms carefully before using TTPro. By using our service, you agree to be bound by these terms.
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
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(40, 75, 99, 0.15)" }}>
                      <Icon className="w-5 h-5" style={{ color: "#284b63" }} />
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
              style={{ backgroundColor: "rgba(40, 75, 99, 0.1)", border: "1px solid rgba(40, 75, 99, 0.2)" }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: "rgba(40, 75, 99, 0.2)" }}>
                <Mail className="w-6 h-6" style={{ color: "#284b63" }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Questions About These Terms?
              </h2>
              <p className="text-white/60 mb-4 max-w-xl mx-auto">
                If you have any questions about these Terms of Service, please reach out to our legal team.
              </p>
              <a
                href="mailto:app.ttpro@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: "#284b63", color: "white" }}
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
                These Terms of Service constitute the entire agreement between you and TTPro regarding your use of the service. If any provision is found to be unenforceable, the remaining provisions will remain in effect.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

