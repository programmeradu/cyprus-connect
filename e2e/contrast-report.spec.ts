import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { APP_PAGES, enterQa } from "./pages";
// Diagnostic only (skipped unless CONTRAST_REPORT=1): unique colour pairs that fail contrast.
test.skip(!process.env.CONTRAST_REPORT, "diagnostic");
test("contrast pairs", async ({ page }) => {
  test.setTimeout(400_000);
  await enterQa(page);
  const pairs = new Map<string, string>();
  for (const p of APP_PAGES) {
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(p.path, { waitUntil: "networkidle" });
      const r = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      for (const v of r.violations) for (const n of v.nodes) {
        const d = n.any[0]?.data as { fgColor: string; bgColor: string; contrastRatio: number } | undefined;
        if (d) pairs.set(`${scheme} ${d.fgColor} on ${d.bgColor} = ${d.contrastRatio}`, `${p.name}: ${n.target.join(" ")}`);
      }
    }
  }
  for (const [k, v] of pairs) console.log(k, "←", v);
});
