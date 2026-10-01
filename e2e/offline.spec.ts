import { test, expect } from "@playwright/test";
import { APP_PAGES, enterQa } from "./pages";

// Outside services down: every request that leaves our own server is cut.
// Each page must still render its heading, with no crash screen and no
// uncaught script error. (Our own server may still call out; that is covered
// by unit tests that stub fetch.)
for (const p of APP_PAGES) {
  test(`outside services down: ${p.name}`, async ({ page, baseURL }) => {
    const own = new URL(baseURL!).host;
    await page.route("**/*", (route) => (new URL(route.request().url()).host === own ? route.continue() : route.abort("internetdisconnected")));
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await enterQa(page);
    await page.goto(p.path, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(page.getByText(/something went wrong|application error|unhandled runtime error/i)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
