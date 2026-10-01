/**
 * Which web domain a company's logo can be looked up by.
 *
 * Order: the company website, then the domain of a work email. Personal mail
 * providers (gmail.com, outlook.com…) are never used, otherwise every
 * Gmail user would show Google's logo. Pure: safe in browser and server code.
 */

const PERSONAL_MAIL = new Set([
  "gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com",
  "yahoo.com", "yahoo.gr", "yahoo.co.uk", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com",
  "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.net", "gmx.de", "mail.com", "zoho.com",
  "yandex.com", "yandex.ru", "mail.ru", "hushmail.com", "tutanota.com", "fastmail.com",
  "cytanet.com.cy", "primehome.com", "spidernet.com.cy", "otenet.gr", "windowslive.com",
]);

const DOMAIN_RE = /^(?=.{3,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

/** "https://www.Acme.com.cy/about" → "acme.com.cy". Null when it is not a public domain. */
export function normalizeDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  let raw = input.trim().toLowerCase();
  if (!raw) return null;
  raw = raw.replace(/^[a-z]+:\/\//, "").split(/[/?#]/)[0].split("@").pop()!.split(":")[0];
  raw = raw.replace(/^www\./, "").replace(/\.$/, "");
  return DOMAIN_RE.test(raw) ? raw : null;
}

export function isPersonalMailDomain(domain: string): boolean {
  return PERSONAL_MAIL.has(domain);
}

export function logoDomain(website?: string | null, email?: string | null): string | null {
  const fromSite = normalizeDomain(website);
  if (fromSite) return fromSite;
  const at = email?.lastIndexOf("@") ?? -1;
  if (!email || at < 0) return null;
  const fromMail = normalizeDomain(email.slice(at + 1));
  return fromMail && !isPersonalMailDomain(fromMail) ? fromMail : null;
}
