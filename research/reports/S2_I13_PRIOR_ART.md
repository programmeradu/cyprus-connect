# S2 prior art: I-13 (calibrated fusion of sector proxy + sparse SME documents)

Date: 2026-09-24. Run: S2-PA-11. Verdict: PASS to S3 on the stated rule, with hard caveats.

## Kill rule (set by director)
KILL if a paper or bank ESG vendor publishes continuous Bayesian updating of per-firm (PCAF Cat 15) estimates from sparse borrower documents. PASS if the state of the art is a hard switch (primary else proxy) or a static regression.

## Findings
- PCAF Standard 2nd ed. 2022 and Part A 3rd ed. Dec 2025: data quality is a discrete 1-5 score. The PCAF-CDP 2023 paper says the score "grades the evidence... does not change the emissions number". No interval method.
- Phillpotts et al., J. Ind. Ecol. 2025, doi:10.1111/jiec.70106: static hierarchical regression (R² 0.89 / 0.72), point prediction. The companion Scope 3 paper (doi:10.1007/s44498-026-00003-5) is also static. No updating when documents arrive.
- Banco de España (Maza 2022, IFC Bulletin 58; DO 2220): input-output x production, static.
- Serafeim & Velez Caicedo, HBS 22-080: AdaBoost point estimates. Nguyen et al., PLOS Climate 2023: low accuracy, no uncertainty method. IAOS 2025: regression imputation with MNAR correction.
- Vendors: Persefoni ("applies the best and lowest applicable score"); MSCI (tiered production, company-intensity, industry-intensity); Bloomberg (ML, else industry-implied); Trucost (discrete tiers + categorical "Data Confidence Scores"); Watershed ("fills data gaps", PCAF scoring); Cogo (static EEIO); Clarity AI (static hybrid LCA). All are hard switch or tiered fallback.
- Patents: keyword search found nothing from Persefoni, Watershed, S&P, MSCI, Moody's, Bloomberg or Clarity AI on Bayesian updating of firm-level emissions.

## Caveats (no optimism)
1. Bayesian updating of a prior with observations is textbook statistics, and hierarchical partial pooling is standard. Any novelty is only: application to SME document sets, calibrated per-firm intervals, and a measured link to PCAF scores. This is the same kind of claim as I-07.
2. Not read: MSCI, Trucost and PCAF 2025 annexes beyond contents pages; vendor-internal whitepapers; Sweep, Greenomy, Normative, Moody's, Sustainalytics, Novata, Briink, Emitwise methodology texts. Absence in public documents is not proof of absence.
3. Patent search was keyword-only, not by assignee portfolio and not Espacenet claim-level. Unpublished applications (18 months) are invisible.
4. PCAF scores are defined by data type, not by uncertainty. A calibrated interval does not by itself move a firm from score 5 to 2-3 under the standard. The claim must be "an interval per score level", not "a score change".
5. Test data: calibration needs firms with known true emissions. We have none for Cyprus. Options: public UK/EU reported SME data, pilot documents, or a bank partner.

## Overlap with I-07
I-13 = a sector prior layer + I-07's document-mixture likelihood. Recommendation: treat them as one programme, "calibrated per-firm emissions from proxy + sparse, ambiguous documents". Pre-register I-13 separately with its own hypotheses.

## Draft S3 hypotheses (not locked; founder must commit)
- H13-1: 90% intervals from proxy-only priors cover the true value in 85-95% of firms (calibrated at DQ5 level).
- H13-2: adding <= 3 documents shrinks the median interval width by >= 50% while coverage stays in 85-95%.
- H13-3: the fused point estimate has lower median absolute error than the hard switch (document annualised, else proxy) by >= 20%.
Data rule: real ground truth required for any claim; synthetic results labelled as such.

## Search queries
The 15 queries are logged in the S2-PA-11 run notes (PCAF Bayesian SME; hierarchical Bayesian firm-level partial pooling; Phillpotts; BdE IFC; Serafeim; PCAF DQ interval; MSCI; Persefoni; Watershed; Trucost; Bloomberg; Cogo/Sweep/Novata/Briink; two patent queries; Trucost confidence scores).
