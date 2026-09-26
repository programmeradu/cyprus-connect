# Things only you can do (outside the app)

Updated after every build turn. Newest changes first. Tick items off here when done.

_Last updated: 26 September 2026 — security, report filters/PDF, logging turn._

**This turn:**
- Run `scripts/sql/0022_sites_and_roles.sql` on the production database before deploying (after `0020` and `0021` if not done). The preview database already has it. It adds a site column to readings and a separate admin-role table.
- Nobody is an admin yet, so the marketplace admin page now refuses everyone. To make yourself admin, run the grant at the bottom of `0022` on production with your own account id (find it in the `user` table by your email). Do not grant the QA test account.
- Readings don't carry a site yet, so the Site filter shows "Whole workspace" only until bills or connections are tagged per site (Limassol, Nicosia...).

**Previous turn:**
- Run `scripts/sql/0021_cbam_suppliers.sql` (and `0020` if not done yet) on the production database before deploying.
- Create a Resend account, verify a sending domain, then set Cloudflare secrets `RESEND_API_KEY` and `EMAIL_FROM`.
- Get the official CBAM Registry XML format (XSD) so the export can be validated.

## Needed now

| # | What | Where | Why it matters | Blocks |
|---|------|-------|----------------|--------|
| 1 | Set `CRON_SECRET` (any long random value) | Cloudflare dashboard → Workers → vuneli → Settings → Variables (secret) | Without it the 15-minute heartbeat skips, so agents only run when you click "Run". | Evidence agent and CBAM agent running on their own |
| 2 | Set `GEMINI_API_KEY` | Cloudflare Worker secrets (same place) | Photo/scan bill reading and the copilot need it. | Bill photo OCR |
| 3 | Confirm the CBAM rules the agent uses, against the official texts: annual declaration due **30 September** of the following year; **50 tonne** yearly exemption (electricity and hydrogen not counted); default values still allowed in the definitive period | EUR-Lex: Regulation (EU) 2023/956 and amending Regulation (EU) 2025/2083; DG TAXUD CBAM page | The agent's deadlines and "below threshold" answer depend on these. I applied them from memory of the amendment; they must be checked before any customer relies on them. | Selling the CBAM agent |
| 4 | Get the Commission's **definitive-period default values table** (with mark-ups) and the full Annex I CN code list | DG TAXUD CBAM page (published implementing acts) | Our built-in defaults are the older indicative table and miss some steel codes (e.g. 7209, 7211, 7219–7229). Lines on defaults are flagged, but the numbers must be the official ones. | Accurate CBAM figures |
| 5 | One real customer customs export (anonymised is fine) | A Cyprus importer of steel, aluminium, cement or fertiliser; or your customs broker | Tells us the real column layout so upload works without reformatting. | First paid CBAM pilot |

## Still open from earlier turns

| # | What | Where | Blocks |
|---|------|-------|--------|
| 6 | Real Cyprus EAC and water bills (5–10, any businesses, with permission) | Pilot businesses | Checking bill reading on real documents |
| 7 | Rotate any credentials that ever sat in the removed migration endpoint | Database provider and any service whose key appeared there | Security |
| 8 | Register at access.gesis.org and download the Eurobarometer SME microdata (paused research) | GESIS | Cyprus-specific evidence for research |
| 9 | EAC / TSO curtailment and tariff data; 3–5 pilot SMEs; licence check for grouping upgrade finance | EAC, TSO Cyprus, CERA, a lawyer | Grid Surplus and Upgrade Club research ideas |

## Legal note on the CBAM signature

Approving "Sign the 2026 CBAM declaration" records your signature on that exact draft in Vuneli (fingerprinted). It does **not** submit anything to the EU CBAM Registry. Submission still needs the importer's own authorised-declarant account (applied for through the Cyprus Customs Department). Decide with a lawyer how you describe this to customers.


## 2026-09-26 (Learn rebuild)
- Course creation needs the AI service key (`LOVABLE_API_KEY`) on the live site. Without it the generator says so and charges nothing.
- New courses stay private to their creator. To share one with every account, an admin must publish it, so give at least one real person the admin role (see scripts/sql/0022).

## 2026-09-26 (shared workspace, phase 3)
- QuickBooks connect now needs QB_CLIENT_ID set in Cloudflare to work; without it the button says QuickBooks is not connected yet (nothing breaks).
- Nothing else new for you.

## 2026-09-26 (shared workspace, phase 2)
- Nothing new for you. Analytics, Grant alerts, Settings and Privacy now use the one shared workspace data.

## 2026-09-26 (shared workspace, phase 1)
- Nothing new to set up outside the app this turn. Earlier items (database update 0022, admin grant, CRON_SECRET, email account, Registry XSD) are still open.
