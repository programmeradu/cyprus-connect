// Tells Bing, Yandex, Seznam and other IndexNow engines that the site changed,
// so new and edited pages are re-crawled within hours instead of weeks.
// Runs after each deploy. Never fails the deploy.
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://vuneli.com").replace(/\/$/, "");
const KEY = "6f1c2a9e4b7d48e3a05c9d2f1b8e7a64";

try {
  const xml = await (await fetch(`${SITE}/sitemap.xml`)).text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).slice(0, 10000);
  if (!urlList.length) throw new Error("sitemap had no URLs");
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
  });
  console.log(`IndexNow: sent ${urlList.length} URLs, status ${res.status}`);
} catch (error) {
  console.warn("IndexNow ping skipped:", error instanceof Error ? error.message : error);
}
