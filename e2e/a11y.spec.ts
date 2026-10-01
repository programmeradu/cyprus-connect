import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { APP_PAGES, enterQa } from "./pages";

// Screen-reader checks: axe-core WCAG 2.1 A/AA rules. Serious and critical
// problems fail the test; the rest are printed so they can be fixed over time.
for (const p of APP_PAGES) {
  test(`screen reader: ${p.name}`, async ({ page }) => {
    await enterQa(page);
    await page.goto(p.path, { waitUntil: "networkidle" });
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    for (const v of r.violations) console.log(`[${p.name}] ${v.impact} ${v.id} ×${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(" | ")}`);
    expect(bad.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

// Keyboard: Tab reaches the page's controls, focus is always visible, and
// focus never gets stuck on one element.
for (const p of APP_PAGES) {
  test(`keyboard: ${p.name}`, async ({ page }) => {
    await enterQa(page);
    await page.goto(p.path, { waitUntil: "networkidle" });
    await page.locator("body").click({ position: { x: 1, y: 1 } });
    const seen = new Set<string>();
    const invisible: string[] = [];
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== "none";
        const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().slice(0, 40);
        return { key: `${el.tagName}|${label}|${el.getBoundingClientRect().top}`, label, ring };
      });
      if (!info) continue;
      seen.add(info.key);
      if (!info.ring) invisible.push(info.label);
    }
    expect(seen.size, "Tab should move through several controls").toBeGreaterThan(3);
    expect(invisible, "every focused control shows a focus ring").toEqual([]);
  });
}
