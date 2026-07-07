"use client";

import { useSession } from "@/lib/auth-client";
import { motion } from "framer-motion";
import Link from "next/link";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";
import { PricingTable } from "@/components/autumn/pricing-table";
import { PaymentGatewaySelector } from "@/components/billing/PaymentGatewaySelector";
import { useState } from "react";

export default function PricingPage() {
  const { data: session } = useSession();
  const [selectedGateway, setSelectedGateway] = useState<'stripe' | 'paystack'>('stripe');

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Header */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-sm font-bold gradient-text tracking-tight cursor-pointer">
              VerdeIQ
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link href="/app">
                <PremiumButton variant="outline" size="sm" className="text-xs px-2.5 py-1 h-7">
                  Dashboard
                </PremiumButton>
              </Link>
            ) : (
              <Link href="/auth">
                <PremiumButton variant="outline" size="sm" className="text-xs px-2.5 py-1 h-7">
                  Sign In
                </PremiumButton>
              </Link>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            <h1 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">
              Simple, Transparent <span className="gradient-text">Pricing</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto mb-8 font-light">
              Choose the perfect plan for your sustainability journey. All plans include our core features with no hidden fees.
            </p>
          </motion.div>

          {/* Payment Gateway Selector */}
          <motion.div
            className="mt-8 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>
            <PaymentGatewaySelector
              value={selectedGateway}
              onChange={setSelectedGateway}
            />
          </motion.div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="relative pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <PricingTable />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-xl font-semibold mb-2">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xs text-muted-foreground font-light">Everything you need to know about pricing</p>
          </motion.div>

          <div className="space-y-3">
            {[
              {
                question: "Can I change plans at any time?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes are prorated and will be reflected in your next billing cycle."
              },
              {
                question: "What payment methods do you accept?",
                answer: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe."
              },
              {
                question: "What happens to unused AI credits?",
                answer: "AI credits reset monthly on your billing date. Professional plan gets 500 credits/month, Enterprise has unlimited. Use them or lose them!"
              },
              {
                question: "What happens if I cancel?",
                answer: "You can cancel anytime. Your account will remain active until the end of your billing period, then you'll be moved to the free plan."
              },
              {
                question: "Do you offer discounts for annual billing?",
                answer: "Yes! Contact our sales team for annual billing options with up to 20% savings."
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <PremiumCard className="p-4">
                  <h3 className="font-semibold text-sm mb-1.5">{faq.question}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {faq.answer}
                  </p>
                </PremiumCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <PremiumCard className="p-6 md:p-8 text-center bg-gradient-to-br from-primary/5 to-primary/10">
              <h2 className="text-xl md:text-2xl font-semibold mb-2.5">
                Ready to Start Your <span className="gradient-text">Sustainability Journey?</span>
              </h2>
              <p className="text-xs text-muted-foreground mb-4 max-w-xl mx-auto font-light">
                Join hundreds of SMEs reducing their carbon footprint with AI-powered insights
              </p>
              <Link href="/auth">
                <PremiumButton size="sm" className="h-8 text-xs px-4">
                  Get Started Free
                  <svg className="w-3 h-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </PremiumButton>
              </Link>
            </PremiumCard>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs text-muted-foreground font-light">
            © 2025 VerdeIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}