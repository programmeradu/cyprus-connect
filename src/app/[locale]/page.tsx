"use client";

import { motion } from "framer-motion";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardDemo } from "@/components/DashboardDemo";
import { SubscriptionBadge } from "@/components/billing/SubscriptionBadge";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Link } from "@/i18n/navigation";
import { useSession, authClient } from "@/lib/auth-client";
import { useRouter } from "@/i18n/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function Home() {
  const { data: session, isPending, refetch } = useSession();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tHero = useTranslations("hero");
  const tL = useTranslations("landing");


  const handleSignOut = async () => {
    const { error } = await authClient.signOut();
    if (error?.code) {
      toast.error(tNav("signOutError"));
    } else {
      localStorage.removeItem("bearer_token");
      refetch();
      toast.success(tNav("signOutSuccess"));
      router.push("/");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Premium 4K Background Image */}
      <div className="fixed inset-0 -z-10">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/941d64ce-418c-43a8-8d2f-da8a089432ee/generated_images/premium-4k-photorealistic-image-of-a-mod-7e888bf4-20251114215917.jpg)'
          }} />

        
        {/* Light Mode - Minimal overlay to let image show */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30 dark:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/25 via-transparent to-background/25 dark:hidden" />
        
        {/* Dark Mode - Dim overlay */}
        <div className="absolute inset-0 hidden dark:block bg-black/60" />
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-background/40 via-background/20 to-background/40" />
        
        {/* Subtle animated accents */}
        <motion.div
          className="absolute top-0 -left-40 w-60 h-60 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} />

        <motion.div
          className="absolute bottom-0 -right-40 w-72 h-72 bg-primary/8 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} />

      </div>

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}>

        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <motion.h1
            className="text-lg font-bold gradient-text tracking-tight"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}>

            VerdeIQ
          </motion.h1>
          
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <LanguageSwitcher />
            <ThemeToggle />
            {!isPending && (
              <>
                {session?.user ? (
                  <>
                    <SubscriptionBadge />
                    <Link href="/pricing">
                      <PremiumButton variant="outline" size="sm" className="font-medium text-xs px-3 py-1 whitespace-nowrap">
                        {tNav("pricing")}
                      </PremiumButton>
                    </Link>
                    <Link href="/app">
                      <PremiumButton variant="outline" size="sm" className="font-medium text-xs px-3 py-1 whitespace-nowrap">
                        {tNav("dashboard")}
                      </PremiumButton>
                    </Link>
                    <PremiumButton
                      variant="outline"
                      size="sm"
                      className="font-medium text-xs px-3 py-1 whitespace-nowrap"
                      onClick={handleSignOut}
                    >
                      {tNav("signOut")}
                    </PremiumButton>
                  </>
                ) : (
                  <>
                    <Link href="/pricing">
                      <PremiumButton variant="outline" size="sm" className="font-medium text-xs px-3 py-1 whitespace-nowrap">
                        {tNav("pricing")}
                      </PremiumButton>
                    </Link>
                    <Link href="/auth">
                      <PremiumButton variant="outline" size="sm" className="font-medium text-xs px-3 py-1 whitespace-nowrap">
                        {tNav("signIn")}
                      </PremiumButton>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}>

              <motion.div
                className="inline-flex items-center gap-2 mb-3 relative group"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}>

                {/* Decorative leaf icon */}
                <motion.svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-primary"
                  animate={{ rotate: [0, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}>

                  <path
                    d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                    fill="currentColor" />

                  <motion.path
                    d="M12 8l-2 4h4z"
                    fill="currentColor"
                    opacity="0.6"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }} />

                </motion.svg>
                
                {/* Text with custom styling */}
                <span className="text-xs font-medium tracking-wider uppercase bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                  {tHero("badge")}
                </span>
                
                {/* Animated underline */}
                <motion.div
                  className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }} />

                
                {/* Corner accents */}
                <motion.div
                  className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }} />

                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }} />

              </motion.div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight tracking-tight">
                <span className="gradient-text">{tHero("titleLine1")}</span>
                <br />
                <span className="text-foreground/90">{tHero("titleLine2")}</span>
                <br />
                <span className="gradient-text">{tHero("titleLine3")}</span>
              </h1>

              <p className="text-sm md:text-base text-foreground/70 dark:text-foreground/60 mb-6 max-w-2xl mx-auto leading-relaxed font-light">
                {tHero("subtitle")}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link href="/auth">
                  <PremiumButton size="sm" className="text-xs px-4 py-2">
                    <span className="whitespace-nowrap">{tHero("ctaPrimary")}</span>
                    <svg className="w-3 h-3 ml-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </PremiumButton>
                </Link>
                <PremiumButton variant="outline" size="sm" className="text-xs px-4 py-2">
                  <svg className="w-3 h-3 mr-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="whitespace-nowrap">{tHero("ctaSecondary")}</span>
                </PremiumButton>
              </div>
            </motion.div>

            {/* Hero Illustration - Interactive Demo */}
            <motion.div
              className="mt-12"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}>

              <div className="relative max-w-6xl mx-auto">
                <motion.div
                  className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/30 to-primary/20 rounded-3xl blur-3xl"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 4, repeat: Infinity }} />

                
                <div className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6">
                  <DashboardDemo />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section - More Modern Grid */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>

            <motion.div
              className="inline-flex items-center gap-2 mb-3 relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}>

              {/* Decorative leaf icon */}
              <motion.svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-primary"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}>

                <path
                  d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                  fill="currentColor" />

                <motion.path
                  d="M12 8l-2 4h4z"
                  fill="currentColor"
                  opacity="0.6"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />

              </motion.svg>
              
              {/* Text with custom styling */}
              <span className="text-xs font-medium tracking-wider uppercase bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Platform Features
              </span>
              
              {/* Animated underline */}
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }} />

              
              {/* Corner accents */}
              <motion.div
                className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />

              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />

            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              {tL("whyTitleA")} <span className="gradient-text">VerdeIQ</span>
            </h2>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground font-light max-w-xl mx-auto">
              {tL("whySubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Benefit 1 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}>

              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="brain" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      {/* Neural Network Pattern */}
                      {[
                      { cx: 30, cy: 35, delay: 0 },
                      { cx: 50, cy: 25, delay: 0.2 },
                      { cx: 70, cy: 35, delay: 0.4 },
                      { cx: 25, cy: 55, delay: 0.6 },
                      { cx: 50, cy: 50, delay: 0.8 },
                      { cx: 75, cy: 55, delay: 1 },
                      { cx: 35, cy: 75, delay: 1.2 },
                      { cx: 65, cy: 75, delay: 1.4 }].
                      map((node, i) =>
                      <motion.circle
                        key={i}
                        cx={node.cx}
                        cy={node.cy}
                        r="3"
                        fill="url(#brain)"
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: node.delay, duration: 0.4 }} />

                      )}
                      {/* Connection Lines */}
                      {[
                      { x1: 30, y1: 35, x2: 50, y2: 25 },
                      { x1: 50, y1: 25, x2: 70, y2: 35 },
                      { x1: 30, y1: 35, x2: 25, y2: 55 },
                      { x1: 70, y1: 35, x2: 75, y2: 55 },
                      { x1: 50, y1: 25, x2: 50, y2: 50 },
                      { x1: 25, y1: 55, x2: 50, y2: 50 },
                      { x1: 75, y1: 55, x2: 50, y2: 50 },
                      { x1: 25, y1: 55, x2: 35, y2: 75 },
                      { x1: 75, y1: 55, x2: 65, y2: 75 },
                      { x1: 50, y1: 50, x2: 35, y2: 75 },
                      { x1: 50, y1: 50, x2: 65, y2: 75 }].
                      map((line, i) =>
                      <motion.line
                        key={i}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke="url(#brain)"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 0.4 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }} />

                      )}
                      {/* Central Processing Node */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="6"
                        fill="none"
                        stroke="url(#brain)"
                        strokeWidth="2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.5, type: "spring", stiffness: 200 }} />

                      <motion.circle
                        cx="50"
                        cy="50"
                        r="2"
                        fill="url(#brain)"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} />

                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  AI-Powered Analytics
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Leverage advanced machine learning to uncover sustainability opportunities 
                  and optimize your environmental impact in real-time.
                </p>
              </PremiumCard>
            </motion.div>

            {/* Benefit 2 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}>

              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="report" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      {/* Document with eco growth */}
                      <motion.rect
                        x="30" y="20" width="40" height="55" rx="4"
                        fill="none"
                        stroke="url(#report)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }} />

                      {/* Document lines */}
                      {[32, 40, 48].map((y, i) =>
                      <motion.line
                        key={i}
                        x1="37" y1={y}
                        x2="63" y2={y}
                        stroke="url(#report)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 1 + i * 0.1 }} />

                      )}
                      {/* Growing plant/leaf visualization */}
                      <motion.path
                        d="M50,56 Q48,62 50,68"
                        fill="none"
                        stroke="url(#report)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 1.5 }} />

                      {/* Left leaf */}
                      <motion.path
                        d="M50,60 Q42,58 38,62"
                        fill="none"
                        stroke="url(#report)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 2 }} />

                      {/* Right leaf */}
                      <motion.path
                        d="M50,62 Q58,60 62,64"
                        fill="none"
                        stroke="url(#report)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 2.2 }} />

                      {/* Checkmark badge */}
                      <motion.circle
                        cx="62" cy="28" r="6"
                        fill="url(#report)"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.5, type: "spring", stiffness: 200 }} />

                      <motion.path
                        d="M59,28 L61,30 L65,26"
                        fill="none"
                        stroke="oklch(0.99 0.005 120)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: 2.7 }} />

                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Automated Reporting
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Generate compliance-ready sustainability reports automatically. 
                  Meet regulatory requirements effortlessly with standardized formats.
                </p>
              </PremiumCard>
            </motion.div>

            {/* Benefit 3 */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}>

              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="monitor" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      {/* Earth/Globe outline */}
                      <motion.circle
                        cx="50" cy="50" r="28"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }} />

                      {/* Latitude/Longitude lines */}
                      <motion.ellipse
                        cx="50" cy="50" rx="28" ry="14"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5 }} />

                      <motion.ellipse
                        cx="50" cy="50" rx="14" ry="28"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.6 }} />

                      {/* Data point markers with pulse animation */}
                      {[
                      { cx: 35, cy: 35, delay: 0 },
                      { cx: 65, cy: 38, delay: 0.3 },
                      { cx: 42, cy: 60, delay: 0.6 },
                      { cx: 60, cy: 62, delay: 0.9 }].
                      map((point, i) =>
                      <g key={i}>
                          <motion.circle
                          cx={point.cx}
                          cy={point.cy}
                          r="2.5"
                          fill="url(#monitor)"
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 1.5 + point.delay, type: "spring" }} />

                          {/* Pulse rings */}
                          <motion.circle
                          cx={point.cx}
                          cy={point.cy}
                          r="2.5"
                          fill="none"
                          stroke="url(#monitor)"
                          strokeWidth="1"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 2.5, opacity: 0 }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: point.delay,
                            ease: "easeOut"
                          }} />

                        </g>
                      )}
                      {/* Center leaf icon */}
                      <motion.path
                        d="M50,46 Q48,50 50,54"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 2 }} />

                      <motion.path
                        d="M50,48 Q45,47 43,50"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 2.2 }} />

                      <motion.path
                        d="M50,50 Q55,49 57,52"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: 2.4 }} />

                      {/* Rotating orbit ring */}
                      <motion.circle
                        cx="50" cy="50" r="34"
                        fill="none"
                        stroke="url(#monitor)"
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        strokeDasharray="3 6"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "50px 50px" }} />

                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Real-Time Monitoring
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Track your carbon footprint, energy consumption, and waste metrics 
                  with live dashboards and instant alerts.
                </p>
              </PremiumCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* NEW: Advanced Features Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>
            <motion.div
              className="inline-flex items-center gap-2 mb-3 relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}>
              <motion.svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-primary"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}>
                <path
                  d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                  fill="currentColor" />
                <motion.path
                  d="M12 8l-2 4h4z"
                  fill="currentColor"
                  opacity="0.6"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />
              </motion.svg>
              <span className="text-xs font-medium tracking-wider uppercase bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Advanced Insights
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }} />
              <motion.div
                className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />
              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              {tL("powerTitleA")} <span className="gradient-text">{tL("powerTitleMid")}</span> {tL("powerTitleB")}
            </h2>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground font-light max-w-xl mx-auto">
              {tL("powerSubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature 1 - Energy Cost Savings */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="energy" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                        <linearGradient id="energyGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.70 0.18 170)" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="oklch(0.60 0.16 150)" stopOpacity="0.3" />
                        </linearGradient>
                      </defs>
                      
                      {/* Outer energy ring */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="32"
                        fill="none"
                        stroke="url(#energyGlow)"
                        strokeWidth="1"
                        strokeDasharray="4 6"
                        initial={{ rotate: 0, opacity: 0 }}
                        whileInView={{ rotate: 360, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear", opacity: { duration: 0.5 } }}
                        style={{ transformOrigin: "50px 50px" }}
                      />

                      {/* Lightning bolt - more detailed */}
                      <motion.path
                        d="M52,22 L38,48 L46,48 L42,56 L36,70 L48,52 L52,52 L48,44 L62,32 Z"
                        fill="url(#energy)"
                        stroke="url(#energy)"
                        strokeWidth="0.5"
                        initial={{ scale: 0, rotate: -20 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      />
                      
                      {/* Inner lightning detail */}
                      <motion.path
                        d="M50,28 L42,46 L47,46 L44,58"
                        fill="none"
                        stroke="oklch(0.99 0.005 120)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6, duration: 0.8 }}
                      />

                      {/* Energy particles */}
                      {[
                        { cx: 30, cy: 35, delay: 0.8 },
                        { cx: 70, cy: 42, delay: 1 },
                        { cx: 35, cy: 60, delay: 1.2 },
                        { cx: 65, cy: 55, delay: 1.4 }
                      ].map((particle, i) => (
                        <motion.circle
                          key={i}
                          cx={particle.cx}
                          cy={particle.cy}
                          r="1.5"
                          fill="url(#energy)"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          animate={{ 
                            scale: [1, 1.5, 1],
                            opacity: [1, 0.5, 1]
                          }}
                          transition={{
                            delay: particle.delay,
                            duration: 2,
                            repeat: Infinity
                          }}
                        />
                      ))}

                      {/* Savings badge */}
                      <motion.g
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                      >
                        <circle cx="70" cy="28" r="8" fill="url(#energy)" />
                        <text
                          x="70"
                          y="31"
                          textAnchor="middle"
                          fill="oklch(0.99 0.005 120)"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          $
                        </text>
                      </motion.g>
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Energy Cost Savings
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Calculate real savings from efficiency improvements with real-time energy prices and carbon intensity data. See ROI in months, not years.
                </p>
              </PremiumCard>
            </motion.div>

            {/* Feature 2 - Industry Benchmarks */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="benchmark" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                        <linearGradient id="benchmarkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.70 0.18 170)" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="oklch(0.60 0.16 150)" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      
                      {/* Background grid */}
                      <motion.g
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.15 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      >
                        {[25, 35, 45, 55, 65].map((y, i) => (
                          <line
                            key={i}
                            x1="15"
                            y1={y}
                            x2="85"
                            y2={y}
                            stroke="url(#benchmark)"
                            strokeWidth="0.5"
                          />
                        ))}
                      </motion.g>

                      {/* Animated bar chart with 3D effect */}
                      {[
                        { height: 25, x: 20, label: "A", highlighted: false },
                        { height: 38, x: 35, label: "B", highlighted: false },
                        { height: 32, x: 50, label: "C", highlighted: false },
                        { height: 48, x: 65, label: "D", highlighted: true }
                      ].map((bar, i) => (
                        <g key={i}>
                          {/* Bar shadow/depth */}
                          <motion.rect
                            x={bar.x + 1}
                            y={70 - bar.height + 1}
                            width="11"
                            height={bar.height}
                            fill="url(#benchmarkGlow)"
                            initial={{ height: 0, y: 70 }}
                            whileInView={{ height: bar.height, y: 70 - bar.height }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.6, type: "spring" }}
                          />
                          
                          {/* Main bar */}
                          <motion.rect
                            x={bar.x}
                            y={70 - bar.height}
                            width="11"
                            height={bar.height}
                            fill="url(#benchmark)"
                            opacity={bar.highlighted ? 1 : 0.5}
                            rx="1.5"
                            initial={{ height: 0, y: 70 }}
                            whileInView={{ height: bar.height, y: 70 - bar.height }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1, duration: 0.6, type: "spring" }}
                          />
                          
                          {/* Highlight on top of bar */}
                          {bar.highlighted && (
                            <motion.rect
                              x={bar.x}
                              y={70 - bar.height}
                              width="11"
                              height="3"
                              fill="oklch(0.99 0.005 120)"
                              opacity="0.6"
                              rx="1.5"
                              initial={{ opacity: 0 }}
                              whileInView={{ opacity: 0.6 }}
                              viewport={{ once: true }}
                              transition={{ delay: 0.9 + i * 0.1 }}
                            />
                          )}
                          
                          {/* Data point on top */}
                          <motion.circle
                            cx={bar.x + 5.5}
                            cy={70 - bar.height - 2}
                            r="1.5"
                            fill="url(#benchmark)"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            animate={bar.highlighted ? {
                              scale: [1, 1.3, 1],
                              opacity: [1, 0.7, 1]
                            } : {}}
                            transition={bar.highlighted ? {
                              delay: 0.9 + i * 0.1,
                              type: "spring",
                              duration: 2,
                              repeat: Infinity
                            } : {
                              delay: 0.9 + i * 0.1,
                              type: "spring"
                            }}
                          />
                        </g>
                      ))}
                      
                      {/* X-axis */}
                      <motion.line
                        x1="15"
                        y1="72"
                        x2="85"
                        y2="72"
                        stroke="url(#benchmark)"
                        strokeWidth="1.5"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                      />

                      {/* Target line with animation */}
                      <motion.line
                        x1="15"
                        y1="32"
                        x2="85"
                        y2="32"
                        stroke="url(#benchmark)"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2, duration: 0.8 }}
                      />
                      
                      {/* Target label badge */}
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
                      >
                        <rect x="72" y="28" width="12" height="8" rx="2" fill="url(#benchmark)" />
                        <text
                          x="78"
                          y="33.5"
                          textAnchor="middle"
                          fill="oklch(0.99 0.005 120)"
                          fontSize="5"
                          fontWeight="bold"
                        >
                          ★
                        </text>
                      </motion.g>

                      {/* Trend arrow */}
                      <motion.path
                        d="M20,60 L35,52 L50,55 L65,40"
                        fill="none"
                        stroke="url(#benchmark)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="2 2"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 0.6 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.8, duration: 1 }}
                      />
                      <motion.path
                        d="M65,40 L61,42 L63,46"
                        fill="url(#benchmark)"
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 0.6 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.3, type: "spring" }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Industry Benchmarking
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Compare your emissions against industry peers. Competitive insights that drive action and show where you stand in your sector.
                </p>
              </PremiumCard>
            </motion.div>

            {/* Feature 3 - Compliance Tracking */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="compliance" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                        <linearGradient id="complianceGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.70 0.18 170)" stopOpacity="0.5" />
                          <stop offset="100%" stopColor="oklch(0.60 0.16 150)" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      
                      {/* Outer glow ring */}
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="36"
                        fill="none"
                        stroke="url(#complianceGlow)"
                        strokeWidth="1"
                        strokeDasharray="2 4"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.4 }}
                        viewport={{ once: true }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        style={{ transformOrigin: "50px 50px" }}
                      />

                      {/* Shield base - outer layer */}
                      <motion.path
                        d="M50,18 L28,28 L28,50 Q28,72 50,82 Q72,72 72,50 L72,28 Z"
                        fill="url(#complianceGlow)"
                        opacity="0.3"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 0.3 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2 }}
                      />
                      
                      {/* Shield main body */}
                      <motion.path
                        d="M50,20 L30,30 L30,50 Q30,70 50,80 Q70,70 70,50 L70,30 Z"
                        fill="none"
                        stroke="url(#compliance)"
                        strokeWidth="2.5"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                      />
                      
                      {/* Shield inner detail lines */}
                      <motion.path
                        d="M50,24 L34,32 L34,50 Q34,66 50,75 Q66,66 66,50 L66,32 Z"
                        fill="none"
                        stroke="url(#compliance)"
                        strokeWidth="1"
                        strokeOpacity="0.3"
                        initial={{ pathLength: 0, opacity: 0 }}
                        whileInView={{ pathLength: 1, opacity: 0.3 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                      />

                      {/* Center division line */}
                      <motion.line
                        x1="50"
                        y1="20"
                        x2="50"
                        y2="80"
                        stroke="url(#compliance)"
                        strokeWidth="1"
                        strokeOpacity="0.2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                      />

                      {/* Checkmark - main stroke */}
                      <motion.path
                        d="M38,50 L46,60 L66,36"
                        fill="none"
                        stroke="url(#compliance)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2, duration: 0.6, ease: "easeOut" }}
                      />
                      
                      {/* Checkmark - inner highlight */}
                      <motion.path
                        d="M39,50 L46,58 L64,37"
                        fill="none"
                        stroke="oklch(0.99 0.005 120)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeOpacity="0.6"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                      />

                      {/* Compliance particles around shield */}
                      {[
                        { cx: 24, cy: 40, delay: 0.8, size: 1 },
                        { cx: 76, cy: 40, delay: 1, size: 1.2 },
                        { cx: 32, cy: 65, delay: 1.2, size: 0.8 },
                        { cx: 68, cy: 65, delay: 1.4, size: 1 }
                      ].map((particle, i) => (
                        <motion.circle
                          key={i}
                          cx={particle.cx}
                          cy={particle.cy}
                          r={particle.size}
                          fill="url(#compliance)"
                          initial={{ scale: 0, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          viewport={{ once: true }}
                          animate={{
                            opacity: [1, 0.4, 1],
                            scale: [1, 1.3, 1]
                          }}
                          transition={{
                            delay: 1.8 + particle.delay,
                            type: "spring",
                            duration: 2.5,
                            repeat: Infinity
                          }}
                        />
                      ))}

                      {/* Top badge/seal */}
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2, type: "spring", stiffness: 200 }}
                      >
                        <circle cx="50" cy="20" r="5" fill="url(#compliance)" />
                        <circle cx="50" cy="20" r="3" fill="oklch(0.99 0.005 120)" opacity="0.8" />
                        <motion.circle
                          cx="50"
                          cy="20"
                          r="5"
                          fill="none"
                          stroke="url(#compliance)"
                          strokeWidth="0.5"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        />
                      </motion.g>

                      {/* Document/certificate icon in corner */}
                      <motion.g
                        initial={{ scale: 0, opacity: 0 }}
                        whileInView={{ scale: 1, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.3, type: "spring", stiffness: 150 }}
                      >
                        <rect
                          x="66"
                          y="24"
                          width="8"
                          height="10"
                          rx="1"
                          fill="none"
                          stroke="url(#compliance)"
                          strokeWidth="1"
                        />
                        <line x1="68" y1="27" x2="72" y2="27" stroke="url(#compliance)" strokeWidth="0.5" />
                        <line x1="68" y1="29" x2="72" y2="29" stroke="url(#compliance)" strokeWidth="0.5" />
                        <line x1="68" y1="31" x2="70" y2="31" stroke="url(#compliance)" strokeWidth="0.5" />
                      </motion.g>

                      {/* Rotating accent arcs */}
                      <motion.path
                        d="M50,15 A35,35 0 0,1 70,25"
                        fill="none"
                        stroke="url(#compliance)"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        strokeDasharray="2 3"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.5, duration: 0.8 }}
                      />
                      <motion.path
                        d="M30,25 A35,35 0 0,1 50,15"
                        fill="none"
                        stroke="url(#compliance)"
                        strokeWidth="1"
                        strokeOpacity="0.4"
                        strokeDasharray="2 3"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 2.7, duration: 0.8 }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Compliance Checker
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Reduce legal and compliance anxiety. Automated CSRD, ESRS, and VSME requirement tracking keeps you ahead of regulatory changes.
                </p>
              </PremiumCard>
            </motion.div>

            {/* Feature 4 - Smart Integrations & OCR */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="integrations" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      
                      {/* Central data hub */}
                      <motion.rect
                        x="40" y="40" width="20" height="20" rx="4"
                        fill="url(#integrations)"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                      />

                      {/* Floating integration nodes */}
                      {[
                        { cx: 25, cy: 25, label: "QB" },
                        { cx: 75, cy: 25, label: "X" },
                        { cx: 25, cy: 75, label: "OCR" },
                        { cx: 75, cy: 75, label: "API" }
                      ].map((node, i) => (
                        <g key={i}>
                          <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r="10"
                            fill="none"
                            stroke="url(#integrations)"
                            strokeWidth="1.5"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + i * 0.1 }}
                          />
                          <motion.line
                            x1={node.cx > 50 ? node.cx - 10 : node.cx + 10}
                            y1={node.cy > 50 ? node.cy - 10 : node.cy + 10}
                            x2={node.cx > 50 ? 55 : 45}
                            y2={node.cy > 50 ? 55 : 45}
                            stroke="url(#integrations)"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.6 + i * 0.1 }}
                          />
                          <motion.circle
                            cx={node.cx}
                            cy={node.cy}
                            r="2"
                            fill="url(#integrations)"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                          />
                        </g>
                      ))}

                      {/* OCR Scanner beam */}
                      <motion.rect
                        x="20" y="70" width="60" height="2"
                        fill="url(#integrations)"
                        opacity="0.3"
                        animate={{ y: [70, 80, 70] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Smart Integrations
                </h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  Seamlessly connect QuickBooks, Xero, and more. Use AI-powered OCR to automatically parse utility bills and invoices for instant tracking.
                </p>
              </PremiumCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* NEW: VerdeIQ Ecosystem Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>
            <motion.div
              className="inline-flex items-center gap-2 mb-3 relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}>
              <motion.svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-primary"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}>
                <path
                  d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                  fill="currentColor" />
                <motion.path
                  d="M12 8l-2 4h4z"
                  fill="currentColor"
                  opacity="0.6"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />
              </motion.svg>
              <span className="text-xs font-medium tracking-wider uppercase bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Full Ecosystem
              </span>
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }} />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              {tL("beyondTitleA")} <span className="gradient-text">{tL("beyondTitleB")}</span>
            </h2>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground font-light max-w-xl mx-auto">
              {tL("beyondSubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ecosystem 1 - AI Learning Center */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="learn" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M20,70 Q50,60 80,70 L80,30 Q50,20 20,30 Z"
                        fill="none"
                        stroke="url(#learn)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                      />
                      <motion.path
                        d="M50,25 L50,65"
                        stroke="url(#learn)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 }}
                      />
                      <motion.circle
                        cx="50" cy="45" r="8"
                        fill="url(#learn)"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1, type: "spring" }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{tL("ecoLearningTitle")}</h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  {tL("ecoLearningDesc")}
                </p>
              </PremiumCard>
            </motion.div>

            {/* Ecosystem 2 - Offset Marketplace */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="market" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      <motion.circle
                        cx="50" cy="50" r="30"
                        fill="none"
                        stroke="url(#market)"
                        strokeWidth="2"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                      />
                      <motion.path
                        d="M35,50 L45,60 L65,40"
                        stroke="url(#market)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 }}
                      />
                      <motion.path
                        d="M50,20 Q60,30 50,40 Q40,30 50,20"
                        fill="url(#market)"
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{tL("ecoMarketplaceTitle")}</h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  {tL("ecoMarketplaceDesc")}
                </p>
              </PremiumCard>
            </motion.div>

            {/* Ecosystem 3 - Creative Media Studio */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="studio" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      <motion.rect
                        x="25" y="30" width="50" height="40" rx="4"
                        fill="none"
                        stroke="url(#studio)"
                        strokeWidth="2"
                        initial={{ pathLength: 0 }}
                        whileInView={{ pathLength: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                      />
                      <motion.circle
                        cx="50" cy="50" r="10"
                        fill="url(#studio)"
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.8 }}
                      />
                      <motion.path
                        d="M75,40 L85,35 L85,65 L75,60"
                        fill="url(#studio)"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 0.5 }}
                        viewport={{ once: true }}
                        transition={{ delay: 1.2 }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{tL("ecoStudioTitle")}</h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  {tL("ecoStudioDesc")}
                </p>
              </PremiumCard>
            </motion.div>

            {/* Ecosystem 4 - Global Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}>
              <PremiumCard className="h-full p-5">
                <div className="mb-4">
                  <div className="relative w-12 h-12">
                    <div className="absolute inset-0 bg-primary/10 rounded-xl" />
                    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10">
                      <defs>
                        <linearGradient id="leader" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="oklch(0.65 0.16 165)" />
                          <stop offset="100%" stopColor="oklch(0.55 0.14 145)" />
                        </linearGradient>
                      </defs>
                      <motion.path
                        d="M30,80 L30,50 L45,50 L45,80 Z"
                        fill="url(#leader)"
                        opacity="0.5"
                        initial={{ height: 0 }}
                        whileInView={{ height: 30 }}
                        viewport={{ once: true }}
                      />
                      <motion.path
                        d="M45,80 L45,30 L60,30 L60,80 Z"
                        fill="url(#leader)"
                        initial={{ height: 0 }}
                        whileInView={{ height: 50 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                      />
                      <motion.path
                        d="M60,80 L60,60 L75,60 L75,80 Z"
                        fill="url(#leader)"
                        opacity="0.5"
                        initial={{ height: 0 }}
                        whileInView={{ height: 20 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4 }}
                      />
                      <motion.path
                        d="M52.5,20 L55,25 L60,25 L56,29 L58,34 L52.5,31 L47,34 L49,29 L45,25 L50,25 Z"
                        fill="url(#leader)"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2">{tL("ecoLeaderboardTitle")}</h3>
                <p className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-xs font-light">
                  {tL("ecoLeaderboardDesc")}
                </p>
              </PremiumCard>
            </motion.div>
          </div>
        </div>
        </section>

        {/* Integrations Row */}
        <section className="relative py-12 border-y border-border/10">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center gap-8"
            >
              <span className="text-[10px] font-bold tracking-[0.2em] text-foreground/60 dark:text-muted-foreground uppercase">
                Seamlessly Integrated With
              </span>
              
              <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-80 dark:opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                {/* QuickBooks */}
                <div className="flex items-center gap-2 group cursor-default">
                  <img 
                    src="https://cdn.simpleicons.org/quickbooks/000000" 
                    alt="QuickBooks" 
                    className="h-6 md:h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity dark:hidden" 
                  />
                  <img 
                    src="https://cdn.simpleicons.org/quickbooks/ffffff" 
                    alt="QuickBooks" 
                    className="h-6 md:h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity hidden dark:block" 
                  />
                </div>

                {/* Xero */}
                <div className="flex items-center gap-2 group cursor-default">
                  <img 
                    src="https://cdn.simpleicons.org/xero/000000" 
                    alt="Xero" 
                    className="h-6 md:h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity dark:hidden" 
                  />
                  <img 
                    src="https://cdn.simpleicons.org/xero/ffffff" 
                    alt="Xero" 
                    className="h-6 md:h-8 w-auto opacity-70 group-hover:opacity-100 transition-opacity hidden dark:block" 
                  />
                </div>

                {/* ClimateTRACE */}
                <div className="flex items-center gap-2 group cursor-default">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    <path d="M2 12h20" />
                  </svg>
                  <span className="font-bold tracking-tight text-base md:text-lg text-foreground">ClimateTRACE</span>
                </div>

                {/* ElectricityMaps */}
                <div className="flex items-center gap-2 group cursor-default">
                  <svg className="w-5 h-5 md:w-6 md:h-6 fill-primary" viewBox="0 0 24 24">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                  </svg>
                  <span className="font-bold tracking-tight text-base md:text-lg text-foreground">ElectricityMaps</span>
                </div>

                {/* Gemini */}
                <div className="flex items-center gap-2 group cursor-default">
                  <img 
                    src="https://cdn.simpleicons.org/googlegemini/000000" 
                    alt="Gemini" 
                    className="h-8 md:h-10 w-auto opacity-70 group-hover:opacity-100 transition-opacity dark:hidden" 
                  />
                  <img 
                    src="https://cdn.simpleicons.org/googlegemini/ffffff" 
                    alt="Gemini" 
                    className="h-8 md:h-10 w-auto opacity-70 group-hover:opacity-100 transition-opacity hidden dark:block" 
                  />
                </div>

                {/* OpenEI */}
                <div className="flex items-center gap-2 group cursor-default">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                    <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                  </svg>
                  <span className="font-bold tracking-tight text-base md:text-lg text-foreground">OpenEI</span>
                </div>

                {/* WikiRate */}
                <div className="flex items-center gap-2 group cursor-default">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" />
                    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                  <span className="font-bold tracking-tight text-base md:text-lg text-foreground">WikiRate</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works Section - More Modern */}
      <section className="relative py-16 px-4">
        
        <div className="relative max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>

            <motion.div
              className="inline-flex items-center gap-2 mb-3 relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}>

              {/* Decorative leaf icon */}
              <motion.svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-primary"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}>

                <path
                  d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                  fill="currentColor" />

                <motion.path
                  d="M12 8l-2 4h4z"
                  fill="currentColor"
                  opacity="0.6"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />

              </motion.svg>
              
              {/* Text with custom styling */}
              <span className="text-xs font-medium tracking-wider uppercase bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Simple Process
              </span>
              
              {/* Animated underline */}
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }} />

              
              {/* Corner accents */}
              <motion.div
                className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />

              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />

            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              {tL("howTitleA")} <span className="gradient-text">{tL("howTitleB")}</span>
            </h2>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground font-light">
              {tL("howSubtitle")}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-0 right-0 h-px">
              <motion.div
                className="h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.5 }} />

            </div>

            {[
            {
              number: 1,
              title: "Connect Your Data",
              description: "Connect QuickBooks, Xero, or upload utility bills via AI-powered OCR. We integrate with your current infrastructure in minutes.",
              icon:
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                    <motion.path
                  d="M30,50 L70,50 M50,30 L50,70"
                  stroke="url(#monitor)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }} />

                    <motion.circle
                  cx="50" cy="50" r="5"
                  fill="url(#monitor)"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }} />

                  </svg>,

              delay: 0.2
            },
            {
              number: 2,
              title: "AI Analyzes & Learns",
              description: "Our AI engine processes your data, identifies patterns, and provides actionable sustainability insights.",
              icon:
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                    <motion.circle
                  cx="50" cy="50" r="28"
                  fill="none"
                  stroke="url(#monitor)"
                  strokeWidth="3"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }} />

                    <motion.circle
                  cx="50" cy="50" r="12"
                  fill="url(#monitor)"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, type: "spring" }} />

                  </svg>,

              delay: 0.4
            },
            {
              number: 3,
              title: "Take Action & Report",
              description: "Implement recommendations, track progress, and generate professional reports for stakeholders.",
              icon:
              <svg viewBox="0 0 100 100" className="w-12 h-12">
                    <motion.path
                  d="M25,55 L42,72 L75,35"
                  fill="none"
                  stroke="url(#monitor)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2 }} />

                  </svg>,

              delay: 0.6
            }].
            map((step, index) =>
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: step.delay, duration: 0.6 }}>

                {/* Modern Card Container */}
                <div className="relative border border-border/20 rounded-2xl p-6 h-full">
                  
                  {/* Content */}
                  <div className="relative flex flex-col items-center text-center">
                    {/* Step Number Badge */}
                    <motion.div
                    className="absolute -top-9 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-base shadow-lg border-2 border-background z-10"
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: step.delay + 0.2, type: "spring", stiffness: 200, damping: 15 }}>

                      {step.number}
                    </motion.div>

                    {/* Icon Container */}
                    <div className="mt-6 mb-5 relative">
                      <motion.div
                      className="relative w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: step.delay + 0.3, type: "spring", stiffness: 150 }}>

                        {/* Animated corner accents */}
                        <motion.div
                        className="absolute -top-1 -left-1 w-3 h-3 border-l-2 border-t-2 border-primary rounded-tl"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: step.delay + 0.5 }} />

                        <motion.div
                        className="absolute -bottom-1 -right-1 w-3 h-3 border-r-2 border-b-2 border-primary rounded-br"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: step.delay + 0.5 }} />

                        {step.icon}
                      </motion.div>
                    </div>
                    
                    {/* Text Content */}
                    <motion.h3
                    className="text-lg font-bold mb-3 tracking-tight"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: step.delay + 0.4 }}>

                      {step.title}
                    </motion.h3>
                    <motion.p
                    className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-sm font-light"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: step.delay + 0.5 }}>

                      {step.description}
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}>

            <motion.div
              className="inline-flex items-center gap-2 mb-3 relative group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}>

              {/* Decorative leaf icon */}
              <motion.svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-primary"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}>

                <path
                  d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                  fill="currentColor" />

                <motion.path
                  d="M12 8l-2 4h4z"
                  fill="currentColor"
                  opacity="0.6"
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }} />

              </motion.svg>
              
              {/* Text with custom styling */}
              <span className="text-xs font-medium tracking-wider uppercase bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                Customer Stories
              </span>
              
              {/* Animated underline */}
              <motion.div
                className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }} />

              
              {/* Corner accents */}
              <motion.div
                className="absolute -top-1 -left-1 w-2 h-2 border-l border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />

              <motion.div
                className="absolute -top-1 -right-1 w-2 h-2 border-r border-t border-primary/30"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }} />

            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              {tL("trustedTitleA")} <span className="gradient-text">{tL("trustedTitleB")}</span>
            </h2>
            <p className="text-sm text-foreground/70 dark:text-muted-foreground font-light">
              {tL("trustedSubtitle")}
            </p>
          </motion.div>

          <motion.div
            className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}>

            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            
            <div className="relative max-w-2xl mx-auto">
              <div className="flex justify-center mb-4 gap-1">
                {[...Array(5)].map((_, i) =>
                <motion.svg
                  key={i}
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  initial={{ opacity: 0, y: -20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, type: "spring" }}>

                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </motion.svg>
                )}
              </div>
              
              <motion.p
                className="text-base md:text-lg font-medium mb-5 text-foreground leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}>

                "VerdeIQ transformed how we approach sustainability. The AI insights 
                helped us <span className="gradient-text">reduce our carbon footprint by 40%</span> in just six months."
              </motion.p>
              
              <motion.div
                className="space-y-1"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}>

                <p className="font-bold text-sm">Sarah Chen</p>
                <p className="text-foreground/60 dark:text-muted-foreground text-xs font-light">CEO, EcoTech Solutions</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-10 text-center overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}>

            <div className="absolute inset-0">
              <motion.div
                className="absolute top-0 left-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.3, 1],
                  x: [-20, 20, -20],
                  y: [-20, 20, -20]
                }}
                transition={{ duration: 10, repeat: Infinity }} />

              <motion.div
                className="absolute bottom-0 right-0 w-64 h-64 bg-primary/15 rounded-full blur-3xl"
                animate={{
                  scale: [1.2, 1, 1.2],
                  x: [20, -20, 20],
                  y: [20, -20, 20]
                }}
                transition={{ duration: 12, repeat: Infinity }} />

            </div>
            
            <div className="relative z-10">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                Ready to Lead on <span className="gradient-text">Sustainability?</span>
              </h2>
              <p className="text-sm text-foreground/70 dark:text-muted-foreground mb-6 font-light max-w-xl mx-auto">
                Join the future of sustainable business today
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth">
                  <PremiumButton size="sm" className="text-xs px-5 py-2">
                    Start Your Free Trial
                    <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </PremiumButton>
                </Link>
                <Link href="/pricing">
                  <PremiumButton variant="outline" size="sm" className="text-xs px-5 py-2">
                    View Pricing Plans
                  </PremiumButton>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-border/30 py-8 px-4 mt-10">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-lg font-bold gradient-text mb-3">VerdeIQ</h3>
          <p className="text-foreground/80 dark:text-muted-foreground mb-4 text-xs font-light">
            {tL("footerTagline")}
          </p>
          <div className="flex flex-col items-center gap-2 mb-4">
            <p className="text-xs text-foreground/70 dark:text-muted-foreground font-light">
              {tL("footerContact")}: <a href="mailto:samuel@stauniverse.tech" className="hover:text-primary transition-colors">samuel@stauniverse.tech</a>
            </p>
            <p className="text-xs text-foreground/70 dark:text-muted-foreground font-light">
              {tL("footerPoweredBy")} <a href="https://stauniverse.tech" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors">StaUniverse</a>
            </p>
          </div>
          <p className="text-xs text-foreground/60 dark:text-muted-foreground font-light">© {new Date().getFullYear()} VerdeIQ. {tL("footerRights")}
          </p>
        </div>
      </footer>
    </div>);

}