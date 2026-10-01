"use client";

/**
 * The workspace copilot.
 *
 * A floating instrument, not a chat toy. It reads the same records the
 * dashboard draws, so the figures it quotes are the figures on screen. It can
 * propose one act at a time; the act stays pending in a card until a person
 * approves it. The command palette navigates, this reasons.
 */

import { invalidateWorkspace } from "@/components/app/console/workspace-store";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Streamdown } from "streamdown";
import { useConsole } from "./ConsoleData";
import { IcoClose, IcoVuneliAi } from "./icons";
import { VuneliAiIcon } from "@/components/brand/VuneliAiIcon";
import {
  ActivityCard,
  BillsCard,
  DeadlinesCard,
  DocumentCard,
  FactsCard,
  FootprintCard,
  FundingCard,
  ProposalCard,
  SuppliersCard,
  TOOL_LABEL,
  verdeText,
  type Lang,
  type ProposalState,
} from "./VerdeCards";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** The page the person is on, so Verde starts from it. */
function pageOf(pathname: string | null): string {
  const seg = (pathname ?? "").split("/").filter(Boolean);
  const i = seg.indexOf("app");
  const next = i === -1 ? undefined : seg[i + 1];
  if (!next) return "home";
  if (next === "compliance") return "deadlines";
  if (next === "analytics" || next === "insights") return "footprint";
  return next;
}

const STARTERS: Record<string, { en: string[]; el: string[] }> = {
  home: {
    en: ["What needs my attention this week?", "Which deadline is closest, and does it apply to us?", "Prepare a Board Summary I can share."],
    el: ["Τι χρειάζεται την προσοχή μου αυτή την εβδομάδα;", "Ποια προθεσμία είναι πιο κοντά και μας αφορά;", "Ετοίμασε μια Σύνοψη για το Διοικητικό Συμβούλιο."],
  },
  footprint: {
    en: ["What changed in my emissions this period?", "Where is most of our footprint coming from?", "Which data is missing from my footprint?"],
    el: ["Τι άλλαξε στις εκπομπές μου αυτή την περίοδο;", "Από πού προέρχεται το μεγαλύτερο αποτύπωμα;", "Ποια δεδομένα λείπουν;"],
  },
  suppliers: {
    en: ["Which suppliers need a check?", "Which suppliers have no email for data requests?", "Are any suppliers on the EU sanctions list?"],
    el: ["Ποιοι προμηθευτές χρειάζονται έλεγχο;", "Ποιοι προμηθευτές δεν έχουν email;", "Υπάρχει προμηθευτής στη λίστα κυρώσεων της ΕΕ;"],
  },
  deadlines: {
    en: ["Which deadlines apply to us and why?", "What do we still need to know to confirm the 'might apply' ones?", "Create a task for the closest deadline."],
    el: ["Ποιες προθεσμίες μας αφορούν και γιατί;", "Τι λείπει για να επιβεβαιώσουμε όσες ίσως ισχύουν;", "Δημιούργησε εργασία για την πιο κοντινή προθεσμία."],
  },
  actions: {
    en: ["Which funding calls could we qualify for?", "What would make us eligible for more grants?", "What should we do first to cut emissions?"],
    el: ["Για ποιες χρηματοδοτήσεις μπορεί να πληρούμε τις προϋποθέσεις;", "Τι θα μας έκανε επιλέξιμους για περισσότερες;", "Τι να κάνουμε πρώτα για να μειώσουμε τις εκπομπές;"],
  },
};

export const VERDE_ASK_EVENT = "vuneli:ask-verde";

/** Opens Verde with a request ready to send. */
/** Set-up hands a description to Verde across a page change; Verde sends it once on arrival. */
export const VERDE_HANDOFF_KEY = "vuneli.verde.handoff";

export function handOffToVerde(prompt: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(VERDE_HANDOFF_KEY, prompt);
}

export function askVerde(prompt?: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(VERDE_ASK_EVENT, { detail: { prompt } }));
}

