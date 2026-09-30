# Bank link rules

- Bank data comes only from read-only PSD2 links here (Bank of Cyprus first): store the subscription id only, never a passcode or user token; payments requested with a zero limit; payments sorted by deterministic rules (`categorize.ts`) that record the matched rule; unmatched or unmarked lines never count as spend. Why: consent-based, auditable evidence with no power to move money.
- Salt Edge bank choices (`saltedge.ts`) list only banks on Salt Edge's public Cyprus coverage page, under their current names; Bank of Cyprus stays direct. Why: no picker option that fails or names a merged bank.
