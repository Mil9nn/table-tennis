"use client";

import Link from "next/link";
import { Twitter, Facebook, Instagram } from "lucide-react";

export default function MarketingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="marketing border-t border-gray-200 bg-gray-50">
      <div className="mx-auto px-4 sm:px-6 py-16">
        {/* Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-[#2fa4d9] to-[#4ac7f6] bg-clip-text text-transparent">
              TTPro
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              The platform for competitive table tennis. Real-time scoring, shot analysis, and tournament management.
            </p>
            <div className="flex items-center gap-4 mt-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>

            <div className="mt-4">
              <a
                href="mailto:app.ttpro@gmail.com"
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                app.ttpro@gmail.com
              </a>
            </div>
          </div>

          <section className="grid grid-cols-3">
          {/* Product Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                    href="/#features"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="/subscription"
                    className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Plans
                  </Link>
                </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/privacy-policy"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-of-service"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/refund-policy"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Refunds & Cancellations
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Shipping & Delivery
                </Link>
              </li>
            </ul>
          </div>
          </section>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 pt-8">
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-500">
              © {currentYear} TTPro. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
