import { useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useTransition } from "react";

function FlagGB({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <clipPath id="ls-gb-c"><path d="M0,0 v30 h60 v-30 z" /></clipPath>
      <clipPath id="ls-gb-t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
      <g clipPath="url(#ls-gb-c)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#ls-gb-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagGR({ className = "" }: { className?: string }) {
  const stripe = 30 / 9;
  const stripes = [0, 2, 4, 6, 8].map((i) => (
    <rect key={i} y={i * stripe} width="45" height={stripe} fill="#0D5EAF" />
  ));
  return (
    <svg viewBox="0 0 45 30" className={className} aria-hidden preserveAspectRatio="xMidYMid slice">
      <rect width="45" height="30" fill="#fff" />
      {stripes}
      <rect width={stripe * 5} height={stripe * 5} fill="#0D5EAF" />
      <rect y={stripe * 2} width={stripe * 5} height={stripe} fill="#fff" />
      <rect x={stripe * 2} width={stripe} height={stripe * 5} fill="#fff" />
    </svg>
  );
}

export function LanguageSwitcher() {
  const params = useParams({ strict: false }) as { locale?: string };
  const locale = (params.locale === "el" ? "el" : "en") as "en" | "el";
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [pending, startTransition] = useTransition();

  const switchTo = (target: "en" | "el") => {
    if (target === locale) return;
    // Replace the leading /:locale segment.
    const rest = pathname.replace(/^\/(en|el)(?=\/|$)/, "") || "/";
    const to = `/${target}${rest === "/" ? "" : rest}` || `/${target}`;
    startTransition(() => {
      void navigate({ to });
      if (typeof window !== "undefined") localStorage.setItem("locale", target);
    });
  };

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="inline-flex items-center gap-0.5 rounded-md border border-foreground/15 p-0.5"
    >
      <button
        type="button"
        onClick={() => switchTo("en")}
        disabled={pending}
        aria-pressed={locale === "en"}
        aria-label="English"
        className={`inline-flex h-7 w-8 items-center justify-center rounded ${locale === "en" ? "bg-muted" : "hover:bg-muted/50"}`}
      >
        <FlagGB className="h-3.5 w-5 rounded-[2px]" />
      </button>
      <button
        type="button"
        onClick={() => switchTo("el")}
        disabled={pending}
        aria-pressed={locale === "el"}
        aria-label="Ελληνικά"
        className={`inline-flex h-7 w-8 items-center justify-center rounded ${locale === "el" ? "bg-muted" : "hover:bg-muted/50"}`}
      >
        <FlagGR className="h-3.5 w-5 rounded-[2px]" />
      </button>
    </div>
  );
}
