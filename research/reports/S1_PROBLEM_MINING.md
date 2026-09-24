# S1 Problem Mining: First Results

**Date:** 24 September 2026. **Status:** partial. Two analyses done, two open.
**Style:** ASD-STE100.

## 1. Cyprus grid: does a flat yearly factor distort Scope 2? (S1-GRID-01, S1-GRID-02)
Data: Eurostat `nrg_cb_pem`, monthly net generation by fuel for Cyprus, Jan 2021 to Jul 2026 (67 months).
Method: monthly factor = (oil GWh x 0.80 + gas GWh x 0.40) / total GWh, in kg CO2/kWh.
Four assumed monthly load shapes: flat office, summer hotel, winter heating, cooling retail.
Output: `data/processed/cy_monthly_grid_factor.csv` and `cy_profile_distortion.csv`.

| Finding | Value |
|---|---|
| Monthly factor range | 0.505 to 0.701 kg/kWh |
| Highest monthly solar + wind share | 36.2% |
| Largest yearly error from a flat factor | 2.97% (summer hotel, 2025) |
| Trend | The error grows each year as solar grows (max 1.1% in 2022, 3.0% in 2025) |
| Annual factor drift | 0.675 (2021) to 0.581 (2025): -14% |
| App today | Uses 0.61 (2024 vintage). A 2025 report with it overstates Scope 2 by about 5% |

**Verdict:** at monthly resolution, seasonality is a small gap (under 3%). It is not a research-grade
problem by itself, so idea I-01 is deprioritised. Using an old factor causes a larger error, but
fixing that is engineering, not research. Open: hourly resolution (midday curtailment) needs hourly
TSO Cyprus data. We have not tested it yet.
Limits: the emission factors per fuel are assumptions (sensitivity range 0.70-0.90 for oil).
The load shapes are assumed, not measured.

## 2. Which VSME datapoints can a Cyprus micro-SME actually prove? (S1-RANK-01)
Source: the 45 VSME Basic fields in the app. Each field is classified by the evidence a
micro-SME has: (a) observed, (b) derivable by known methods, (c) derivable only with unknown
error, (d) not derivable.

Result: a = 22, b = 12, **c = 8, d = 3**. Of the 28 numeric fields, 11 (39%) are c or d.

Ranked open problems (the top 3 stay in the top 3 in 26 of 27 weightings):
1. **Total energy** and 2. **renewable share.** Rooftop PV on net-metering / net-billing hides the
   self-consumed kWh, and the bill shows only the net import.
3. **Scope 1.** Fuel evidence is card lines in EUR only, or handwritten slips with no litres.
4. Scope 2 market-based (thin Guarantee of Origin market, residual mix availability).
5. Water from unmetered boreholes. 6. Hazardous waste. 7-8. Waste mass (class d, maybe unsolvable).

Limits: the classification and the weights are judgement, recorded row by row in
`s1/datapoints_classified.csv`. Next, pilot SME documents must validate them.

## 3. Scope 1 from EUR-only fuel card lines (S1-FUEL-01)
Data: EU Weekly Oil Bulletin, Cyprus pump prices 2022-2025 (checksum in manifest).
Method: 2,000 simulated SMEs per year and fuel, 20-80 fill-ups each, station price spread 2.5%. Seed 20260924.

| Method to turn EUR into litres | Error range (p5 to p95) |
|---|---|
| Yearly average price | within ±2.7% |
| Weekly price at the payment date | within ±0.7% |
| Wrong fuel type assumed (petrol vs diesel) | +7% to +11% (2023-2025) |

**Verdict:** converting price to litres is solved by known methods, so it is not research.
The error comes from *classification*: which fuel it was, and how much of a station payment was
fuel versus shop items. We cannot measure the second without real bank data. I-04 is reframed.
S2 must decide if the classification is research or plain engineering.

## 4. Still open in S1
- Size of problem 1: share of Cyprus SMEs with rooftop PV on net-metering or net-billing, and the
  typical self-consumption share (sources: CERA, EAC, RES and Energy Conservation Fund data).
- CBAM fields (SAD customs data) and ESRS datapoints: not yet in the regulation graph.

## 5. Candidates going to S2 (prior-art gate)
I-03 hidden PV self-consumption, I-04 Scope 1 from fragmentary fuel evidence, I-02 confidence
scoring + evidence ranking. All three are candidates only. None is an innovation claim.
