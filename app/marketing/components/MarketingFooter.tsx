"use client";

import Link from "next/link";
import { Twitter, Facebook, Instagram } from "lucide-react";

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="marketing border-t border-white/10">
      <div className="mx-auto px-4 sm:px-6 py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#2fa4d9] to-[#4ac7f6] bg-clip-text text-transparent">
              TTPro
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              The platform for competitive table tennis. Real-time scoring, shot analysis, and tournament management.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/40 hover:text-white/80 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-4">
              <a
                href="mailto:app.ttpro@gmail.com"
                className="text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                app.ttpro@gmail.com
              </a>
            </div>
          </div>

          <section className="grid grid-cols-3">
          {/* Product Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                    href="/#features"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/subscription"
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Plans
                  </Link>
                </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Refunds & Cancellations
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="text-sm text-white/60 hover:text-white transition-colors"
                >
                  Shipping & Delivery
                </Link>
              </li>
            </ul>
          </div>
          </section>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-white/50">
              © {currentYear} TTPro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
