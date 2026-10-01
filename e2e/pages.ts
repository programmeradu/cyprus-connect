/** The /app pages a business actually uses, checked by every e2e suite. */
export const APP_PAGES = [
  { name: "Home", path: "/en/app" },
  { name: "Footprint", path: "/en/app/analytics" },
  { name: "Action plan", path: "/en/app/actions" },
  { name: "Suppliers", path: "/en/app/suppliers" },
  { name: "Deadlines", path: "/en/app/compliance" },
  { name: "Reports", path: "/en/app/reports" },
  { name: "CBAM", path: "/en/app/cbam" },
  { name: "Agents", path: "/en/app/agents" },
  { name: "Connect", path: "/en/app/integrations" },
  { name: "Settings", path: "/en/app/settings" },
  { name: "Home (Greek)", path: "/el/app" },
  { name: "Suppliers (Greek)", path: "/el/app/suppliers" },
] as const;

export async function enterQa(page: import("@playwright/test").Page) {
  await page.goto("/api/qa/enter?to=/en/app", { waitUntil: "domcontentloaded" });
  // Skip the first-visit tour so it does not cover the page under test.
  await page.evaluate(() => fetch("/api/console/tour", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "done" }) })).catch(() => {});
}
