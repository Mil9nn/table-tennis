"use client";

import Link from "next/link";
import { 
  Truck, 
  ArrowLeft, 
  Monitor,
  Zap,
  Globe,
  Mail,
  HelpCircle
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

export default function ShippingPolicyPage() {
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
              <Truck className="w-8 h-8" style={{ color: "#3c6e71" }} />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Shipping & Delivery Policy
            </h1>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Information about how TTPro services are delivered to you.
            </p>
            <p className="text-white/40 text-sm mt-4">
              Last updated: {lastUpdated}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Digital Service Notice */}
      <section className="pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 md:p-8 text-center"
            style={{ backgroundColor: "rgba(60, 110, 113, 0.15)", border: "1px solid rgba(60, 110, 113, 0.3)" }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4" style={{ backgroundColor: "rgba(60, 110, 113, 0.2)" }}>
              <Monitor className="w-7 h-7" style={{ color: "#3c6e71" }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              100% Digital Service
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              TTPro is a <span className="text-white font-semibold">digital platform</span> that provides online table tennis scoring, analytics, and tournament management services. We do not sell or ship any physical products.
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
            {/* Digital Delivery */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                  <Zap className="w-5 h-5" style={{ color: "#3c6e71" }} />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Instant Digital Delivery
                </h2>
              </div>
              <div className="space-y-4 pl-14">
                <div>
                  <h3 className="text-white font-medium mb-2">How It Works</h3>
                  <p className="text-white/60 leading-relaxed">
                    Upon successful payment, your subscription or premium features are activated <span className="text-white font-medium">instantly</span>. There is no physical shipping involved as all our services are delivered digitally through our web platform.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Access Your Services</h3>
                  <p className="text-white/60 leading-relaxed">
                    Once your payment is confirmed, you can immediately access all premium features by logging into your TTPro account. You will also receive a confirmation email with your purchase details.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">Delivery Time</h3>
                  <p className="text-white/60 leading-relaxed">
                    Digital delivery is <span className="text-white font-medium">immediate</span> upon successful payment processing. In rare cases of payment gateway delays, activation may take up to 15 minutes.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Global Access */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(60, 110, 113, 0.15)" }}>
                  <Globe className="w-5 h-5" style={{ color: "#3c6e71" }} />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Global Availability
                </h2>
              </div>
              <div className="space-y-4 pl-14">
                <div>
                  <h3 className="text-white font-medium mb-2">Worldwide Access</h3>
                  <p className="text-white/60 leading-relaxed">
                    As a digital service, TTPro is available globally. You can access our platform from anywhere in the world with an internet connection, 24 hours a day, 7 days a week.
                  </p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-2">No Shipping Costs</h3>
                  <p className="text-white/60 leading-relaxed">
                    Since there are no physical products to ship, there are <span className="text-white font-medium">no shipping fees, customs duties, or delivery charges</span> associated with your purchase.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* What You Get */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8"
              style={{ backgroundColor: "rgba(60, 110, 113, 0.1)", border: "1px solid rgba(60, 110, 113, 0.2)" }}
            >
              <h3 className="text-white font-semibold mb-4 text-lg">What&apos;s Included in Your Purchase</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 text-white/70">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#3c6e71" }} />
                  <span>Access to premium match scoring features</span>
                </div>
                <div className="flex items-start gap-3 text-white/70">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#3c6e71" }} />
                  <span>Advanced statistics and analytics</span>
                </div>
                <div className="flex items-start gap-3 text-white/70">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#3c6e71" }} />
                  <span>Tournament management tools</span>
                </div>
                <div className="flex items-start gap-3 text-white/70">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#3c6e71" }} />
                  <span>Priority customer support</span>
                </div>
                <div className="flex items-start gap-3 text-white/70">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#3c6e71" }} />
                  <span>Leaderboard and ranking features</span>
                </div>
                <div className="flex items-start gap-3 text-white/70">
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: "#3c6e71" }} />
                  <span>Team management capabilities</span>
                </div>
              </div>
            </motion.div>

            {/* Contact Section */}
            <motion.div
              variants={fadeInUp}
              className="rounded-2xl p-6 md:p-8 text-center"
              style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)" }}
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ backgroundColor: "rgba(60, 110, 113, 0.2)" }}>
                <HelpCircle className="w-6 h-6" style={{ color: "#3c6e71" }} />
              </div>
              <h2 className="text-xl font-semibold text-white mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Need Assistance?
              </h2>
              <p className="text-white/60 mb-4 max-w-xl mx-auto">
                If you&apos;re experiencing issues accessing your purchased services or have any questions, please don&apos;t hesitate to reach out.
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
                This policy applies to all digital services offered by TTPro. For questions about refunds, please refer to our <Link href="/refund-policy" className="underline hover:text-white/60">Refund Policy</Link>.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}

