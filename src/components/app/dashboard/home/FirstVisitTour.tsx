"use client";

/**
 * A short guided first visit. Each step rings a real part of Home with the
 * lime accent and places a small card beside it. Shown once per account
 * (stored on the account, so a new device does not show it again); the
 * browser copy only bridges the moment before the account answer arrives.
 * "Replay the tour" in the account menu starts it again.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { invalidateWorkspace, useWorkspaceAction, useWorkspaceResource } from "@/components/app/console/workspace-store";

const TOUR_PATH = "/api/console/tour";

const STEPS = ["footprint", "waiting", "deadline", "verde", "nav"] as const;
type Step = (typeof STEPS)[number];

export const TOUR_REPLAY_EVENT = "vuneli:replay-tour";
const keyFor = (workspaceId: string) => `vuneli.homeTour.done.${workspaceId}`;

export function replayHomeTour() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(TOUR_REPLAY_EVENT));
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function FirstVisitTour({ workspaceId }: { workspaceId: string }) {
  const t = useTranslations("home.tour");
  const [index, setIndex] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(null);
  const status = useWorkspaceResource<{ done: boolean }>(TOUR_PATH);
  const { run } = useWorkspaceAction();
  const decided = useRef(false);

  /* Replay from the account menu or ?tour=1 always shows it. */
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("tour") === "1") {
        url.searchParams.delete("tour");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        decided.current = true;
        setIndex(0);
      }
    } catch {
      /* ignore */
    }
    const replay = () => {
      decided.current = true;
      setIndex(0);
    };
    window.addEventListener(TOUR_REPLAY_EVENT, replay);
    return () => window.removeEventListener(TOUR_REPLAY_EVENT, replay);
  }, []);

  /* Decide once the account answers. A browser that already finished the
     tour (before it was stored on the account) copies that to the account
     instead of showing it again. If the account cannot be read, stay quiet. */
  useEffect(() => {
    if (decided.current || !status.data) return;
    decided.current = true;
    if (status.data.done) return;
    let localDone = false;
    try {
      localDone = localStorage.getItem(keyFor(workspaceId)) === "1";
    } catch {
      /* ignore */
    }
    if (localDone) void run(TOUR_PATH, { body: { action: "done" }, invalidates: [TOUR_PATH] });
    else setIndex(0);
  }, [status.data, workspaceId, run]);

  /* Steps whose target is not on screen (for example the queue is hidden on a
     narrow layout) are skipped instead of pointing at nothing. */
  const available = STEPS.filter((s) => typeof document === "undefined" || document.querySelector(`[data-tour="${s}"]`));
  const step: Step | null = index !== null ? (available[index] ?? null) : null;

  const finish = useCallback(() => {
    try {
      localStorage.setItem(keyFor(workspaceId), "1");
    } catch {
      /* ignore */
    }
    setIndex(null);
    setBox(null);
    void run(TOUR_PATH, { body: { action: "done" }, invalidates: [TOUR_PATH] }).then((r) => {
      if (!r) invalidateWorkspace([TOUR_PATH]);
    });
  }, [workspaceId, run]);

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 6;
    setBox({ top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 });
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step}"]`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
    const id = window.setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  /* Place the card below the target, or above it when there is no room,
     and keep it inside the viewport on phones. */
  useLayoutEffect(() => {
    if (!box || !cardRef.current) return;
    const card = cardRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 12;
    let top = box.top + box.height + gap;
    if (top + card.height > vh - 12) top = Math.max(12, box.top - card.height - gap);
    if (top + card.height > vh - 12) top = Math.max(12, vh - card.height - 12);
    const left = Math.min(Math.max(12, box.left), Math.max(12, vw - card.width - 12));
    setCardPos({ top, left });
  }, [box]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, finish]);

  useEffect(() => {
    if (index !== null && available.length > 0 && index >= available.length) finish();
  }, [index, available.length, finish]);

  if (index === null || !step || !box) return null;
  const last = index === available.length - 1;

  return (
    <div className="vch-tour" role="dialog" aria-modal="false" aria-labelledby="vch-tour-title">
      <div className="vch-tour-ring" style={{ top: box.top, left: box.left, width: box.width, height: box.height }} aria-hidden="true" />
      <div
        ref={cardRef}
        className="vch-tour-card"
        style={cardPos ? { top: cardPos.top, left: cardPos.left } : { top: -9999, left: 0 }}
      >
        <small>{t("step", { n: index + 1, total: available.length })}</small>
        <strong id="vch-tour-title">{t(`${step}.title`)}</strong>
        <p>{t(`${step}.body`)}</p>
        <div className="vch-tour-actions">
          <button type="button" className="vch-link" onClick={finish}>
            {t("skip")}
          </button>
          <span>
            {index > 0 && (
              <button type="button" className="vch-btn" onClick={() => setIndex(index - 1)}>
                {t("back")}
              </button>
            )}
            <button type="button" className="vch-btn" data-kind="primary" autoFocus onClick={() => (last ? finish() : setIndex(index + 1))}>
              {last ? t("done") : t("next")}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
