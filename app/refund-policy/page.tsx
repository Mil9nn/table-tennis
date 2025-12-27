"use client";

import Link from "next/link";
import { 
  RotateCcw, 
  ArrowLeft, 
  CreditCard, 
  XCircle, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Mail,
  Info
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

export default function RefundPolicyPage() {
  const lastUpdated = "December 27, 2024";

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
              <RotateCcw className="w-8 h-8" style={{ color: "#3c6e71" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Cancellation & Refund Policy
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Please read our refund and cancellation policy carefully before making a purchase.
            </p>
            <p className="text-white/40 text-sm mt-4">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* No Refund Notice */}
      <section className="pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 md:p-8 text-center"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ backgroundColor: "rgba(239, 68, 68, 0.2)" }}>
              <XCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              No Refunds Policy
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              All purchases made on TTPro are <span className="text-white font-semibold">final and non-refundable</span>. Once a subscription or payment is processed, no refunds will be issued under any circumstances.
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
            {/* Why No Refunds */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                  <Info className="w-5 h-5" style={{ color: "#3c6e71" }} />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Why We Don&apos;t Offer Refunds
                </h2>
              </div>
              <div className="space-y-4 pl-14 text-white/60 leading-relaxed">
                <p>
                  TTPro provides immediate access to premium digital features upon purchase. Since our services are delivered instantly and can be used immediately after payment, we maintain a strict no-refund policy.
                </p>
                <p>
                  We encourage all users to thoroughly explore our free features before upgrading to a premium subscription. This ensures you understand exactly what you&apos;re purchasing.
                </p>
              </div>
            </motion.div>

            {/* Before You Purchase */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(60, 110, 113, 0.1)", border: "1px solid rgba(60, 110, 113, 0.2)" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.2)" }}>
                  <CheckCircle className="w-5 h-5" style={{ color: "#3c6e71" }} />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Before You Purchase
                </h2>
              </div>
              <div className="pl-14">
                <p className="text-white/60 mb-4">We recommend the following before making a purchase:</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#3c6e71" }} />
                    <span>Try our <span className="text-white">free features</span> to understand how the platform works</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#3c6e71" }} />
                    <span>Review the <span className="text-white">subscription details</span> and features included in each plan</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#3c6e71" }} />
                    <span>Read our <Link href="/terms-of-service" className="text-white underline hover:no-underline">Terms of Service</Link> carefully</span>
                  </li>
                  <li className="flex items-start gap-3 text-white/70">
                    <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#3c6e71" }} />
                    <span>Contact our <Link href="/contact" className="text-white underline hover:no-underline">support team</Link> if you have any questions</span>
                  </li>
                </ul>
              </div>
            </motion.div>

            {/* Subscription Cancellation */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                  <CreditCard className="w-5 h-5" style={{ color: "#3c6e71" }} />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Subscription Cancellation
                </h2>
              </div>
              <div className="space-y-4 pl-14">
                <div>
                  <h3 className="text-white font-medium mb-2">How to Cancel</h3>
                  <p className="text-white/60 leading-relaxed">
                    You can cancel your subscription at any time through your account settings. Navigate to <span className="text-white">Profile → Subscription → Cancel Subscription</span>. You can also contact our support team for assistance.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">When Cancellation Takes Effect</h3>
                  <p className="text-white/60 leading-relaxed">
                    Your cancellation will take effect at the end of your current billing period. You&apos;ll continue to have access to premium features until then. <span className="text-white font-medium">No refunds or prorated credits will be issued for the remaining period.</span>
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">After Cancellation</h3>
                  <p className="text-white/60 leading-relaxed">
                    Once your subscription ends, your account will revert to the free plan. Your match history and data will be preserved, but you&apos;ll lose access to premium features like advanced analytics and unlimited tournaments.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Exceptions */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(251, 191, 36, 0.1)", border: "1px solid rgba(251, 191, 36, 0.2)" }}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(251, 191, 36, 0.2)" }}>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-3 text-lg">Limited Exceptions</h3>
                  <p className="text-white/60 mb-4">
                    In rare cases, we may consider exceptions to our no-refund policy at our sole discretion:
                  </p>
                  <ul className="space-y-2 text-white/70 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      Duplicate charges due to technical errors on our end
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      Unauthorized transactions (with valid proof)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400">•</span>
                      Service completely unavailable for extended periods
                    </li>
                  </ul>
                  <p className="text-white/50 text-sm mt-4">
                    These exceptions are evaluated on a case-by-case basis and are not guaranteed.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8 text-center"
              style={{ backgroundColor: "rgba(60, 110, 113, 0.1)", border: "1px solid rgba(60, 110, 113, 0.2)" }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: "rgba(60, 110, 113, 0.2)" }}>
                <HelpCircle className="w-6 h-6" style={{ color: "#3c6e71" }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Questions?
              </h2>
              <p className="text-white/60 mb-4 max-w-xl mx-auto">
                If you have questions about our refund policy or need assistance before making a purchase, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:app.ttpro@gmail.com"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105"
                  style={{ backgroundColor: "#3c6e71", color: "white" }}
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-300 hover:scale-105 border"
                  style={{ borderColor: "rgba(60, 110, 113, 0.5)", color: "#3c6e71" }}
                >
                  Visit Help Center
                </Link>
              </div>
            </motion.div>

            {/* Footer Note */}
            <motion.div
              variants={fadeInUp}
              className="text-center pt-8 border-t"
              style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <p className="text-white/40 text-sm">
                By making a purchase on TTPro, you acknowledge that you have read and agree to this no-refund policy.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
