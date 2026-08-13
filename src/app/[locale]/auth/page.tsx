"use client";

import Image from "next/image";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import authPhoto from "@/assets/auth-limestone-desk.jpg";

const FIELD =
  "w-full rounded-none border-0 border-b border-border/70 bg-transparent px-0 py-2 text-[15.5px] font-medium text-foreground placeholder:font-normal placeholder:text-foreground/35 focus:border-foreground focus:outline-none focus:ring-0 disabled:opacity-60";

const LABEL =
  "block text-[12.5px] font-semibold uppercase tracking-[0.1em] text-foreground/60";

export default function AuthPage() {
  const t = useTranslations("auth");
  const searchParams = useSearchParams();
  const locale = (useLocale() as "en" | "el") ?? "en";
  const el = locale === "el";
  const [mode, setMode] = useState<"login" | "register" | "reset">(
    searchParams.get("reset") === "1" ? "reset" : "login"
  );
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
      if (mode === "reset") {
        if (formData.password !== formData.confirmPassword) {
          toast.error(t("toast.passwordMismatch"));
          setIsLoading(false);
          return;
        }

        const { error } = await authClient.updatePassword(formData.password);
        if (error) {
          toast.error(t("toast.unexpected"));
          setIsLoading(false);
          return;
        }

        toast.success(t("toast.passwordUpdated"));
        setMode("login");
      } else if (mode === "register") {
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

        if (error) {
          const errorMessages: Record<string, string> = {
            USER_ALREADY_EXISTS: t("toast.userExists"),
          };
          toast.error(errorMessages[error.code ?? ""] || t("toast.registerFailed"));
          setIsLoading(false);
          return;
        }

        toast.success(t("toast.accountCreated"));
        setMode("login");
      } else {
        const { error } = await authClient.signIn.email({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
          callbackURL: "/app",
        });

        if (error) {
          toast.error(t("toast.loginInvalid"));
          setIsLoading(false);
          return;
        }

        toast.success(t("toast.welcomeBack"));
        window.location.assign(`/${locale}/app`);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error(t("toast.unexpected"));
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) return;

    setIsLoading(true);
    const { error } = await authClient.resetPassword({
      email: formData.email,
      redirectTo: `${window.location.origin}/${locale}/auth/callback?next=/${locale}/auth?reset=1`,
    });

    if (error) toast.error(t("toast.passwordResetFailed"));
    else toast.success(t("passwordResetSent"));
    setIsLoading(false);
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await authClient.signIn.social({
        provider: "google",
        callbackURL: `/${locale}/app`,
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


  const assurances: [string, string][] = [
    [el ? "Δεδομένα" : "Data", el ? "Φιλοξενία στην ΕΕ" : "Hosted in the EU"],
    [el ? "Πρόσβαση" : "Access", el ? "Ξεκινήστε με έναν λογαριασμό ρεύματος" : "Start with one electricity bill"],
    [el ? "Πλαίσιο" : "Scope", el ? "Κύπρος, CSRD, VSME, CBAM" : "Cyprus, CSRD, VSME, CBAM"],
  ];

  return (
    <div className="h-[100svh] overflow-hidden bg-background text-foreground antialiased selection:bg-[var(--accent-lime)] selection:text-black">
      <div className="h-full lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        {/* ------------------------------------------------ Editorial plate */}
        <aside className="relative isolate hidden h-full overflow-hidden border-r border-border/60 lg:block">
          <Image
            src={authPhoto}
            alt="A Cyprus office desk with an electricity bill, a reporting ledger and an olive branch"
            fill
            priority
            sizes="50vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/45" />

          <div className="relative flex h-full flex-col justify-between overflow-hidden p-[clamp(1.5rem,4vh,3.5rem)]">
            <Link
              href="/"
              className="font-[family-name:var(--editorial-display)] text-[clamp(18px,2.6vh,22px)] font-semibold tracking-[-0.02em] text-white"
            >
              Vuneli
            </Link>

            <div className="max-w-md">
              <p className="text-[12.5px] font-semibold uppercase tracking-[0.14em] text-white/70">
                {el ? "Λογαριασμός" : "Account"}
              </p>
              <p
                className="mt-[clamp(0.75rem,2vh,1.25rem)] font-[family-name:var(--editorial-display)] text-[clamp(1.55rem,4.4vh,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-white"
                style={{ textWrap: "balance" }}
              >
                {el
                  ? "Ένας λογαριασμός ρεύματος είναι αρκετός για να αρχίσετε."
                  : "One electricity bill is enough to begin."}
              </p>
              <p className="mt-[clamp(0.75rem,2vh,1.25rem)] hidden max-w-sm text-[clamp(14px,1.9vh,16px)] font-medium leading-[1.55] text-white/80 [@media(min-height:620px)]:block">
                {el
                  ? "Το Vuneli μετατρέπει τα δεδομένα της επιχείρησής σας σε αναφορές που δέχονται οι τράπεζες, οι πελάτες και οι ρυθμιστές."
                  : "Vuneli turns your business data into reports that banks, customers and regulators accept."}
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-px overflow-hidden border border-white/20 bg-white/20 sm:grid-cols-3">
              {assurances.map(([label, value]) => (
                <div
                  key={label}
                  className="bg-black/45 px-4 py-[clamp(0.6rem,1.6vh,1rem)] backdrop-blur-sm"
                >
                  <dt className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-white/60">
                    {label}
                  </dt>
                  <dd className="mt-1 text-[clamp(12.5px,1.7vh,13.5px)] font-semibold leading-snug text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        {/* -------------------------------------------------------- Form side */}
        <main className="flex h-full min-h-0 flex-col">
          <header className="flex shrink-0 items-center justify-between gap-4 px-5 py-[clamp(0.5rem,1.6vh,1rem)] sm:px-10">
            <Link
              href="/"
              className="font-[family-name:var(--editorial-display)] text-[20px] font-semibold tracking-[-0.02em] lg:invisible"
            >
              Vuneli
            </Link>
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-5 pb-[clamp(0.75rem,2.5vh,2.5rem)] sm:px-10">
            <div className="my-auto w-full max-w-[27rem] shrink-0">
              {/* Mode switch */}
              <div className="flex items-center gap-6 border-b border-border/60">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    aria-current={mode === m}
                    className={[
                      "-mb-px border-b-2 pb-[clamp(0.45rem,1.4vh,0.85rem)] text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                      mode === m
                        ? "border-foreground text-foreground"
                        : "border-transparent text-foreground/50 hover:text-foreground/80",
                    ].join(" ")}
                  >
                    {m === "login" ? t("tabSignIn") : t("tabSignUp")}
                  </button>
                ))}
              </div>

              <h1
                className="mt-[clamp(1rem,3vh,1.75rem)] font-[family-name:var(--editorial-display)] text-[clamp(1.5rem,3.6vh,2.15rem)] font-semibold leading-[1.08] tracking-[-0.025em]"
                style={{ textWrap: "balance" }}
              >
                {mode === "reset" ? t("setNewPassword") : mode === "login" ? t("signInTitle") : t("createTitle")}
              </h1>
              <p className="mt-[clamp(0.45rem,1.2vh,0.75rem)] hidden text-[clamp(14px,1.9vh,15.5px)] font-medium leading-[1.5] text-foreground/65 [@media(min-height:560px)]:block">
                {mode === "login" ? t("signInSubtitle") : mode === "register" ? t("createSubtitle") : ""}
              </p>

              {/* Google */}
              {mode !== "reset" && <button
                onClick={handleGoogleAuth}
                disabled={isLoading}
                className="mt-[clamp(1rem,3vh,1.75rem)] flex h-[clamp(2.5rem,5.4vh,2.9rem)] w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card px-5 text-[15px] font-semibold tracking-[-0.01em] transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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
                <span className="min-w-0 truncate">{t("google")}</span>
              </button>}

              {mode !== "reset" && <div className="my-[clamp(0.9rem,2.6vh,1.6rem)] flex items-center gap-4">
                <span className="h-px flex-1 bg-border/70" />
                <span className="text-[12px] font-semibold uppercase tracking-[0.1em] text-foreground/50">
                  {t("orEmail")}
                </span>
                <span className="h-px flex-1 bg-border/70" />
              </div>}

              <form
                onSubmit={handleSubmit}
                className="space-y-[clamp(0.85rem,2.5vh,1.5rem)]"
              >
                <div
                  className={
                    mode === "register"
                      ? "grid grid-cols-1 gap-x-4 gap-y-[clamp(0.75rem,2vh,1.25rem)] [@media(max-height:820px)]:grid-cols-2 sm:grid-cols-2 sm:gap-x-6"
                      : "space-y-[clamp(0.85rem,2.5vh,1.5rem)]"

                  }
                >
                {mode === "register" && (
                  <div>
                    <label className={LABEL} htmlFor="name">
                      {t("name")}
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`mt-1.5 ${FIELD}`}
                      placeholder={t("namePh")}
                      autoComplete="name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                )}

                {mode !== "reset" && <div>
                  <label className={LABEL} htmlFor="email">
                    {t("email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`mt-1.5 ${FIELD}`}
                    placeholder={t("emailPh")}
                    autoComplete="email"
                    required
                    disabled={isLoading}
                  />
                </div>}

                <div>
                  <label className={LABEL} htmlFor="password">
                    {t("password")}
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`mt-1.5 ${FIELD}`}
                    placeholder={t("passwordPh")}
                    required
                    disabled={isLoading}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                  />
                </div>

                {(mode === "register" || mode === "reset") && (
                  <div>
                    <label className={LABEL} htmlFor="confirmPassword">
                      {t("confirmPassword")}
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className={`mt-1.5 ${FIELD}`}
                      placeholder={t("passwordPh")}
                      required
                      disabled={isLoading}
                      autoComplete="new-password"
                    />
                  </div>
                )}
                </div>

                {mode === "login" && (
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) =>
                        setFormData({ ...formData, rememberMe: e.target.checked })
                      }
                      className="h-4 w-4 shrink-0 rounded-[3px] border-border accent-[var(--accent-lime)]"
                      disabled={isLoading}
                    />
                    <span className="text-[14.5px] font-medium text-foreground/70">
                      {t("rememberMe")}
                    </span>
                  </label>
                )}

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    disabled={isLoading}
                    className="-mt-1 block text-left text-[13.5px] font-semibold text-foreground/65 underline-offset-4 hover:text-foreground hover:underline disabled:opacity-60"
                  >
                    {t("forgotPassword")}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="mt-[clamp(0.25rem,1vh,0.6rem)] inline-flex h-[clamp(2.5rem,5.4vh,2.9rem)] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent-lime)] px-6 text-[15.5px] font-semibold tracking-[-0.01em] text-[var(--accent-lime-foreground)] shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--accent-lime)_55%,transparent)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  <span className="min-w-0 truncate">
                    {isLoading ? t("processing") : mode === "login" ? t("signIn") : mode === "reset" ? t("resetPassword") : t("createAccount")}
                  </span>
                  {!isLoading && (
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  )}
                </button>
              </form>



            </div>
          </div>
        </main>
      </div>
    </div>
  );

}
