"""Vuneli 5-year model. Single source of truth for every figure in the plan."""
import json

YEARS = [2026, 2027, 2028, 2029, 2030]

# --- Pricing (gross EUR, ex-VAT recognised) -------------------------------
PRO_MRR = 45.0
ENT_MRR = 185.0
PRO_ARPA_Y = PRO_MRR * 12          # 540
ENT_ARPA_Y = ENT_MRR * 12          # 2220

# Services: CBAM filing pack + assurance-ready VSME review
SERVICE_PRICE = 950.0

# --- Customers (end of year) ---------------------------------------------
pro_eoy = [120, 420, 980, 1750, 2700]
ent_eoy = [8, 34, 82, 145, 230]
pro_boy = [0] + pro_eoy[:-1]
ent_boy = [0] + ent_eoy[:-1]

# gross monthly logo churn
churn_m = [0.025, 0.022, 0.019, 0.017, 0.015]

# services attach: share of paying accounts buying one service engagement
svc_attach = [0.35, 0.30, 0.26, 0.24, 0.22]

def avg(a, b):
    return (a + b) / 2

# --- Revenue --------------------------------------------------------------
rev_pro, rev_ent, rev_svc = [], [], []
for i in range(5):
    rev_pro.append(avg(pro_boy[i], pro_eoy[i]) * PRO_ARPA_Y)
    rev_ent.append(avg(ent_boy[i], ent_eoy[i]) * ENT_ARPA_Y)
    base = avg(pro_boy[i], pro_eoy[i]) + avg(ent_boy[i], ent_eoy[i])
    rev_svc.append(base * svc_attach[i] * SERVICE_PRICE)
revenue = [rev_pro[i] + rev_ent[i] + rev_svc[i] for i in range(5)]

arr_eoy = [pro_eoy[i] * PRO_ARPA_Y + ent_eoy[i] * ENT_ARPA_Y for i in range(5)]

# --- COGS -----------------------------------------------------------------
# hosting+db, AI inference (Lovable AI gateway), data feeds, payment fees,
# and the customer-success time booked against delivery.
def cogs_block(i):
    accounts = avg(pro_boy[i], pro_eoy[i]) + avg(ent_boy[i], ent_eoy[i])
    hosting = 4800 + accounts * 11          # infra per account/yr
    ai = accounts * 26                      # model inference per account/yr
    data = [3600, 7200, 11000, 14000, 17000][i]   # EAC/CYSTAT/ElectricityMaps feeds
    psp = revenue[i] * 0.021                # Stripe
    delivery = rev_svc[i] * 0.42            # reviewer time on service revenue
    support = [9000, 26000, 52000, 78000, 104000][i]
    return dict(hosting=hosting, ai=ai, data=data, psp=psp,
                delivery=delivery, support=support)

cogs_rows = [cogs_block(i) for i in range(5)]
cogs = [sum(r.values()) for r in cogs_rows]
gross = [revenue[i] - cogs[i] for i in range(5)]
gm = [gross[i] / revenue[i] for i in range(5)]

# --- Headcount (Cyprus-resident unless noted) -----------------------------
# (role, start_year_index, start_month, base_salary_eur)
EMPLOYER_LOAD = 0.199
HIRES = [
    ("Founder / CEO (relocating, Cyprus-resident from M1)", 0, 1, 42000),
    ("Founder / CTO (relocating, Cyprus-resident from M1)", 0, 1, 42000),
    ("Senior full-stack engineer (Nicosia)", 0, 3, 46000),
    ("Sustainability lead / VSME reviewer (Limassol)", 0, 4, 38000),
    ("Sales lead, Cyprus SME (Nicosia)", 0, 6, 36000),
    ("Customer success associate (Greek/English)", 0, 9, 26000),
    ("Data engineer, Cyprus integrations", 1, 2, 44000),
    ("Account executive, accountancy channel", 1, 4, 34000),
    ("Product designer", 1, 7, 38000),
    ("Second VSME/CBAM reviewer", 1, 9, 36000),
    ("Backend engineer", 2, 1, 46000),
    ("Account executive #2", 2, 3, 34000),
    ("Compliance & DPO officer (part-time to FTE)", 2, 5, 40000),
    ("Support associate #2", 2, 8, 26000),
    ("Engineering manager", 3, 1, 58000),
    ("Two engineers (Greece/Cyprus)", 3, 3, 92000),
    ("Marketing manager", 3, 5, 40000),
    ("Account executive #3 (Greece)", 3, 9, 36000),
    ("Four-person delivery + engineering pod", 4, 1, 168000),
    ("Partnerships manager (EU)", 4, 4, 46000),
]

def headcount_cost(i):
    total = 0.0
    heads = 0
    for _, yi, m, sal in HIRES:
        if yi < i:
            total += sal * (1 + EMPLOYER_LOAD)
            heads += 1 if sal < 60000 else (2 if sal < 120000 else 4)
        elif yi == i:
            months = 13 - m
            total += sal * (1 + EMPLOYER_LOAD) * months / 12
            heads += 1 if sal < 60000 else (2 if sal < 120000 else 4)
    return total, heads

people = [headcount_cost(i) for i in range(5)]
payroll = [p[0] for p in people]
heads_eoy = [p[1] for p in people]

# --- Opex by function -----------------------------------------------------
# payroll split by function (share of total payroll)
split = dict(rnd=0.52, sales=0.28, ga=0.20)
rnd_pay = [payroll[i] * split['rnd'] for i in range(5)]
sm_pay = [payroll[i] * split['sales'] for i in range(5)]
ga_pay = [payroll[i] * split['ga'] for i in range(5)]

marketing_spend = [38000, 72000, 110000, 150000, 185000]
ga_other = [46000, 62000, 84000, 108000, 132000]   # audit, legal, office, insurance
rnd_other = [14000, 22000, 30000, 38000, 46000]    # tooling, certification, research

rnd = [rnd_pay[i] + rnd_other[i] for i in range(5)]
sm = [sm_pay[i] + marketing_spend[i] for i in range(5)]
ga = [ga_pay[i] + ga_other[i] for i in range(5)]
opex = [rnd[i] + sm[i] + ga[i] for i in range(5)]
ebitda = [gross[i] - opex[i] for i in range(5)]

# --- Unit economics -------------------------------------------------------
new_pro = [pro_eoy[i] - pro_boy[i] * (1 - churn_m[i]) ** 12 for i in range(5)]
new_ent = [ent_eoy[i] - ent_boy[i] * (1 - churn_m[i]) ** 12 for i in range(5)]
new_logos = [new_pro[i] + new_ent[i] for i in range(5)]
cac = [sm[i] / new_logos[i] for i in range(5)]

def blended_arpa(i):
    p = avg(pro_boy[i], pro_eoy[i]); e = avg(ent_boy[i], ent_eoy[i])
    if p + e == 0: return 0
    return (p * PRO_ARPA_Y + e * ENT_ARPA_Y) / (p + e)

arpa = [blended_arpa(i) for i in range(5)]
life_m = [1 / c for c in churn_m]
ltv = [arpa[i] / 12 * gm[i] * life_m[i] for i in range(5)]
ratio = [ltv[i] / cac[i] for i in range(5)]
payback = [cac[i] / (arpa[i] / 12 * gm[i]) for i in range(5)]

# --- Funding & cash -------------------------------------------------------
FOUNDER = 90000
GRANT_Y1 = 120000     # RIF PRE-SEED tranche
GRANT_Y2 = 180000     # RIF SEED tranche
EQUITY = 600000       # seed round, closed M3 of Y1
SERIES_A = 2000000    # Series A, planned M7 of Y3 (2028)
funding_in = [FOUNDER + EQUITY + GRANT_Y1, GRANT_Y2, SERIES_A, 0, 0]

capex = [12000, 10000, 12000, 14000, 16000]
wc = [-0.06 * (revenue[i] - (revenue[i-1] if i else 0)) for i in range(5)]

cash = []
bal = 0.0
for i in range(5):
    net = ebitda[i] - capex[i] + wc[i] + funding_in[i]
    bal += net
    cash.append(dict(net=net, close=bal))

# Monthly Y1/Y2 cash to find the low point.
def monthly_curve():
    pts = []
    bal = FOUNDER
    for i in range(2):
        # straight-line the operating burn, step the funding in
        monthly_ebitda = ebitda[i] / 12
        for m in range(1, 13):
            inflow = 0.0
            if i == 0 and m == 3: inflow += EQUITY
            if i == 0 and m == 7: inflow += GRANT_Y1
            if i == 1 and m == 5: inflow += GRANT_Y2
            bal += monthly_ebitda - capex[i] / 12 + inflow
            pts.append((i * 12 + m, bal))
    return pts

curve = monthly_curve()
low_m, low_v = min(curve, key=lambda t: t[1])

out = dict(
    revenue=revenue, rev_pro=rev_pro, rev_ent=rev_ent, rev_svc=rev_svc,
    arr_eoy=arr_eoy, cogs=cogs, cogs_rows=cogs_rows, gross=gross, gm=gm,
    payroll=payroll, heads=heads_eoy, rnd=rnd, sm=sm, ga=ga, opex=opex,
    ebitda=ebitda, cac=cac, ltv=ltv, ratio=ratio, payback=payback,
    arpa=arpa, new_logos=new_logos, churn_m=churn_m,
    pro_eoy=pro_eoy, ent_eoy=ent_eoy, cash=cash, funding_in=funding_in,
    low_month=low_m, low_cash=low_v,
)

if __name__ == "__main__":
    def e(x): return f"{x:,.0f}"
    print("YEAR      ", "  ".join(str(y) for y in YEARS))
    print("Revenue   ", "  ".join(e(v) for v in revenue))
    print("ARR eoy   ", "  ".join(e(v) for v in arr_eoy))
    print("COGS      ", "  ".join(e(v) for v in cogs))
    print("GM%       ", "  ".join(f"{v*100:.1f}" for v in gm))
    print("Payroll   ", "  ".join(e(v) for v in payroll))
    print("Heads     ", heads_eoy)
    print("Opex      ", "  ".join(e(v) for v in opex))
    print("EBITDA    ", "  ".join(e(v) for v in ebitda))
    print("Cash close", "  ".join(e(c['close']) for c in cash))
    print("CAC       ", "  ".join(e(v) for v in cac))
    print("LTV       ", "  ".join(e(v) for v in ltv))
    print("LTV:CAC   ", "  ".join(f"{v:.1f}" for v in ratio))
    print("Payback m ", "  ".join(f"{v:.1f}" for v in payback))
    print("ARPA      ", "  ".join(e(v) for v in arpa))
    print("New logos ", "  ".join(f"{v:.0f}" for v in new_logos))
    print("low point month", low_m, e(low_v))
