"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    rememberMe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "register") {
        if (formData.password !== formData.confirmPassword) {
          toast.error(t("toast.passwordMismatch"));
          setIsLoading(false);
          return;
        }

        const { error } = await authClient.signUp.email({
          email: formData.email,
          name: formData.name,
          password: formData.password,
        });

        if (error?.code) {
          const errorMessages: Record<string, string> = {
            USER_ALREADY_EXISTS: t("toast.userExists"),
          };
          toast.error(errorMessages[error.code] || t("toast.registerFailed"));
          setIsLoading(false);
          return;
        }

        toast.success(t("toast.accountCreated"));

        const { error: loginError } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
          callbackURL: "/app",
        });

        if (!loginError) {
          router.push("/app");
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
          callbackURL: "/app",
        });

        if (error?.code) {
          toast.error(t("toast.loginInvalid"));
          setIsLoading(false);
          return;
        }

        toast.success(t("toast.welcomeBack"));
        router.push("/app");
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(t("toast.unexpected"));
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/app",
      });

      if (error) {
        console.error("Google OAuth error:", error);
        toast.error(t("toast.googleFailed"));
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Google OAuth error:", error);
      toast.error(t("toast.googleFailed"));
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    toast.info(t("demoToast"));
  };


  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Premium 4K Background Image - Same as landing page */}
      <div className="fixed inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/project-uploads/941d64ce-418c-43a8-8d2f-da8a089432ee/generated_images/premium-4k-photorealistic-image-of-a-mod-7e888bf4-20251114215917.jpg)'
          }}
        />
        
        {/* Light Mode - Minimal overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/20 to-background/30 dark:hidden" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/25 via-transparent to-background/25 dark:hidden" />
        
        {/* Dark Mode - Dim overlay */}
        <div className="absolute inset-0 hidden dark:block bg-foreground/60" />
        <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-background/40 via-background/20 to-background/40" />
        
        {/* Subtle animated accents */}
        <motion.div
          className="absolute top-0 -left-40 w-60 h-60 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute bottom-0 -right-40 w-72 h-72 bg-primary/8 rounded-full blur-3xl"
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/">
            <motion.h1
              className="text-lg font-bold gradient-text tracking-tight cursor-pointer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              VerdeIQ
            </motion.h1>
          </Link>
          
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </motion.nav>

      {/* Auth Container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-20">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Glass Card */}
          <div className="relative bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-premium">
            {/* Gradient overlay */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <motion.div
                className="text-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="inline-flex items-center gap-2 mb-2">
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-primary"
                    animate={{ rotate: [0, 5, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <path
                      d="M12 2C8 2 4 6 4 10c0 4 4 8 8 12 4-4 8-8 8-12 0-4-4-8-8-8zm0 14c-2.5-2-5-4.5-5-6 0-2.5 2.5-5 5-5s5 2.5 5 5c0 1.5-2.5 4-5 6z"
                      fill="currentColor"
                    />
                    <motion.path
                      d="M12 8l-2 4h4z"
                      fill="currentColor"
                      opacity="0.6"
                      animate={{ opacity: [0.3, 0.8, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </motion.svg>
                  <span className="text-xs font-medium tracking-wider uppercase text-primary">
                    {t("welcome")}
                  </span>
                </div>
                <h2 className="text-xl font-bold mb-1.5">
                  {mode === "login" ? t("signInTitle") : t("createTitle")}
                </h2>
                <p className="text-xs text-muted-foreground font-light">
                  {mode === "login" ? t("signInSubtitle") : t("createSubtitle")}
                </p>
              </motion.div>

              {/* Mode Toggle */}
              <motion.div
                className="flex gap-1.5 mb-5 p-1 bg-muted/30 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <button
                  onClick={() => setMode("login")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all-smooth ${
                    mode === "login"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("tabSignIn")}
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all-smooth ${
                    mode === "register"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t("tabSignUp")}
                </button>
              </motion.div>

              {/* Google OAuth Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-2 px-3 bg-card/50 hover:bg-card/80 border border-border/50 rounded-lg text-xs font-medium transition-all-smooth flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {t("google")}
                  </span>
                </button>
              </motion.div>

              {/* Divider */}
              <motion.div
                className="flex items-center gap-3 my-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground font-light">{t("orEmail")}</span>
                <div className="flex-1 h-px bg-border/50" />
              </motion.div>

              {/* Form */}
              <AnimatePresence mode="wait">
                <motion.form
                  key={mode}
                  onSubmit={handleSubmit}
                  className="space-y-3.5"
                  initial={{ opacity: 0, x: mode === "login" ? -20 : 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: mode === "login" ? 20 : -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Name Field (Register Only) */}
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-xs font-medium mb-1.5 text-foreground/80">
                        {t("name")}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all-smooth"
                        placeholder={t("namePh")}
                        required
                        disabled={isLoading}
                      />
                    </motion.div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-foreground/80">
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all-smooth"
                      placeholder={t("emailPh")}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-foreground/80">
                      {t("password")}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all-smooth"
                      placeholder={t("passwordPh")}
                      required
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </div>

                  {/* Confirm Password (Register Only) */}
                  {mode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label className="block text-xs font-medium mb-1.5 text-foreground/80">
                        {t("confirmPassword")}
                      </label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary transition-all-smooth"
                        placeholder={t("passwordPh")}
                        required
                        disabled={isLoading}
                        autoComplete="off"
                      />
                    </motion.div>
                  )}

                  {/* Remember Me */}
                  {mode === "login" && (
                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={formData.rememberMe}
                          onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                          className="w-3 h-3 rounded border-border/50 text-primary focus:ring-primary/50"
                          disabled={isLoading}
                        />
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors font-light">
                          {t("rememberMe")}
                        </span>
                      </label>
                    </div>
                  )}

                  {/* Submit Button */}
                  <PremiumButton
                    type="submit"
                    size="sm"
                    className="w-full text-xs px-3 py-2 mt-4"
                    disabled={isLoading}
                  >
                    {isLoading ? t("processing") : mode === "login" ? t("signIn") : t("createAccount")}
                    {!isLoading && (
                      <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                  </PremiumButton>
                </motion.form>
              </AnimatePresence>

              {/* Footer Links */}
              <motion.div
                className="mt-4 text-center text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <p className="text-muted-foreground font-light">
                  {mode === "login" ? (
                    <>
                      {t("noAccount")}{" "}
                      <button
                        onClick={() => setMode("register")}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                        disabled={isLoading}
                      >
                        {t("switchSignUp")}
                      </button>
                    </>
                  ) : (
                    <>
                      {t("haveAccount")}{" "}
                      <button
                        onClick={() => setMode("login")}
                        className="text-primary hover:text-primary/80 font-medium transition-colors"
                        disabled={isLoading}
                      >
                        {t("switchSignIn")}
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Demo Access Card */}
          <motion.div
            className="mt-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card/30 backdrop-blur-sm border border-border/30 rounded-full text-xs">
              <span className="text-muted-foreground font-light">{t("demoQuestion")}</span>
              <button
                onClick={handleDemoAccess}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
                disabled={isLoading}
              >
                {t("demoTry")}
              </button>
            </div>

          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}