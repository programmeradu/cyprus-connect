# VerdeIQ API Integrations Guide

## Overview

VerdeIQ now includes three powerful data integrations to enhance sustainability insights:

1. **Energy Pricing & Cost Savings** - Real-time electricity pricing and carbon intensity
2. **Industry Benchmarks** - Peer comparison and sector performance metrics
3. **Regulatory Compliance** - Deadline tracking for CSRD, SEC, CBAM, and more

---

## 🔋 Energy Pricing Integration

### Data Sources

#### **Electricity Maps API**
- **Purpose**: Real-time carbon intensity and renewable energy percentage
- **Coverage**: 160+ zones globally (US, EU, Asia-Pacific)
- **Free Tier**: 30 requests/day, 100+ zones
- **Cost**: Free tier available, paid plans from $49/month

**Setup:**
1. Sign up at [Electricity Maps Portal](https://portal.electricitymaps.com/auth/login)
2. Get your API key from Developer Hub
3. Add to `.env`: `ELECTRICITY_MAPS_API_KEY=your_key_here`

**Available Zones:**
- US: `US-CAL-CISO`, `US-MIDA-PJM`, `US-TEX-ERCO`, `US-NY-NYIS`
- Europe: `DE`, `FR`, `GB`, `ES`, `IT`, `NL`
- Full list: [Electricity Maps Zones](https://api.electricitymaps.com/v3/zones)

#### **OpenEI Utility Rates API**
- **Purpose**: US electricity rates by ZIP code and utility
- **Coverage**: 3,834+ US utilities
- **Cost**: Free, no rate limits for most use cases

**Setup:**
1. Register at [OpenEI API Signup](https://apps.openei.org/services/api/signup)
2. Instant API key generation
3. Add to `.env`: `OPENEI_API_KEY=your_key_here`

### Features

- **Real-time Carbon Intensity**: Current grid emissions (gCO2/kWh)
- **Renewable Percentage**: Live renewable energy mix
- **Cost Optimization**: Calculate savings by shifting energy usage
- **24-Hour Forecast**: Predict optimal times for energy consumption
- **Utility Rate Lookup**: Local electricity pricing by ZIP code

### API Endpoints

**Get Energy Pricing Data:**
```bash
GET /api/energy-pricing?zone=US-CAL-CISO&zipCode=94102&energyUsageKwh=10000
```

**Response:**
```json
{
  "zone": "US-CAL-CISO",
  "carbonIntensity": {
    "current": 245,
    "renewablePercentage": 42.5,
    "fossilFuelPercentage": 57.5
  },
  "costSavings": {
    "carbonSavingsKg": 85.2,
    "costSavingsUSD": 45.00,
    "percentageReduction": 12.3,
    "optimalTime": "2025-11-17T02:00:00Z",
    "recommendation": "Shift energy usage to 2:00 AM to save 85.2 kg CO2"
  },
  "utilityRates": {
    "utility": "Pacific Gas & Electric",
    "averageRatePerKwh": 0.1543,
    "monthlyCost": {
      "totalCost": 1774.45,
      "energyCharges": 1543.00,
      "estimatedTaxesFees": 231.45
    }
  },
  "forecast": [...]
}
```

---

## 📊 Industry Benchmarks Integration

### Data Sources

#### **Climate TRACE**
- **Purpose**: Global emissions data by sector and country
- **Coverage**: 2.7M+ emission sources, 744M+ assets
- **Data**: Annual country/sector emissions (2015-2024)
- **Cost**: Free, open data (Creative Commons Attribution 4.0)

**Setup:**
- No API key required
- Uses CSV bulk downloads + fallback mock data
- Auto-enabled in the application

#### **WikiRate API**
- **Purpose**: Company ESG metrics and disclosure data
- **Coverage**: 5M+ data points, 100,000+ companies
- **Cost**: Free, open-source

**Setup:**
- No API key required
- Public API access: `https://wikirate.org/use_the_API`
- Auto-enabled with fallback data

### Features

- **Peer Percentile Ranking**: See where you rank (Top 25%, Above Average, etc.)
- **Sector Benchmarks**: Compare against global industry averages
- **Country Emissions**: National emission trends by sector
- **Performance Insights**: AI-generated recommendations based on your ranking

### API Endpoints

**Get Industry Benchmarks:**
```bash
GET /api/industry-benchmarks?sector=manufacturing&country=USA&companyEmissions=500
```

**Response:**
```json
{
  "sector": "manufacturing",
  "country": "USA",
  "sectorBenchmarks": {
    "globalAverage": 650,
    "unit": "kgCO2e per unit"
  },
  "peerComparison": {
    "companyEmissions": 500,
    "percentile": "35.2",
    "interpretation": "Above average",
    "benchmarkAverage": 650,
    "differenceFromAverage": -23.1
  },
  "insights": [
    "Your manufacturing operations are in the top 35% for sustainability performance.",
    "The manufacturing sector average carbon intensity is trending downward by 3-5% annually."
  ]
}
```

---

## 📋 Regulatory Compliance Integration

### Built-in Compliance Tracker

- **No API keys required** - Built-in data maintained by VerdeIQ
- **Frameworks Covered**: CSRD, SEC Climate Rule, CBAM, UK SDR, TCFD, GRI, ISSB
- **Regions**: EU, US, UK, Global

### Tracked Requirements

#### **EU - CSRD (Corporate Sustainability Reporting Directive)**
- Phase 1 (Apr 2025): NFRD companies first report
- Phase 2 (Apr 2026): Large companies (250+ employees)
- Phase 3 (Apr 2027): Listed SMEs (with 2-year opt-out)

#### **EU - CBAM (Carbon Border Adjustment Mechanism)**
- Definitive Period (Jan 2026): Carbon import tax active
- SME Relief: 50-tonne exemption threshold

#### **US - SEC Climate Rule**
- Phase 1 (Dec 2026): Large accelerated filers
- Scope 1/2 emissions disclosure required

#### **UK - SDR (Sustainability Disclosure Requirements)**
- Implementation (Jan 2027): UK SRS aligned with ISSB
- Asset managers and owners reporting

### Features

- **Compliance Score**: Track completion percentage
- **Upcoming Deadlines**: 180-day lookahead by default
- **Priority Levels**: High/Medium/Low risk classification
- **SME Filtering**: Only show requirements applicable to SMEs
- **Recommendations**: AI-generated compliance guidance

### API Endpoints

**Get Compliance Status:**
```bash
GET /api/compliance?region=EU&isSME=true&daysAhead=180
```

**Response:**
```json
{
  "score": {
    "completed": 1,
    "inProgress": 2,
    "notStarted": 4,
    "total": 7,
    "percentage": 14.3
  },
  "upcoming": [
    {
      "id": "csrd-2027-sme",
      "name": "CSRD Phase 3 - Listed SMEs",
      "framework": "CSRD",
      "region": "EU",
      "deadline": "2027-04-15",
      "daysUntilDeadline": 520,
      "priority": "high",
      "description": "Listed SMEs report 2026 fiscal year"
    }
  ],
  "recommendations": [
    "CSRD requires double materiality assessment.",
    "Regular compliance audits reduce reporting stress by 60%."
  ]
}
```

---

## 🎯 Unified Insights Dashboard

### Location
Navigate to **`/app/insights`** in the VerdeIQ application.

### Features

#### **Energy Pricing Section**
- Real-time carbon intensity with renewable %
- Cost optimization recommendations
- 24-hour forecast visualization
- Local utility rate information

#### **Industry Benchmarks Section**
- Your percentile ranking vs. peers
- Sector performance comparison
- AI-generated industry insights
- Trend analysis

#### **Compliance Section**
- Overall compliance score (0-100%)
- Upcoming deadlines with day countdown
- Status breakdown (Completed/In Progress/Not Started)
- Priority recommendations

### Key Metrics Cards
1. **Carbon Intensity**: Current grid emissions
2. **Potential Savings**: Monthly cost reduction opportunity
3. **Peer Percentile**: Industry ranking position
4. **Compliance Score**: Regulatory readiness percentage

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
npm install axios
# or
bun install axios
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your API keys:

```env
# Required for Energy Pricing
ELECTRICITY_MAPS_API_KEY=your_key_here
OPENEI_API_KEY=your_key_here

# Optional (fallback data available)
# Climate TRACE: No key needed (free CSV downloads)
# WikiRate: No key needed (free API)
# Compliance Tracker: Built-in data
```

### 3. Get API Keys

**Electricity Maps** (Free Tier: 30 req/day):
1. Visit: https://portal.electricitymaps.com/auth/login
2. Sign up for free account
3. Go to Developer Hub → Copy API token
4. Paste into `.env`

**OpenEI** (Free, Unlimited):
1. Visit: https://apps.openei.org/services/api/signup
2. Fill registration form
3. Instant API key generation
4. Paste into `.env`

### 4. Test the Integration

**Option A: Use the UI**
1. Navigate to `/app/insights`
2. View real-time data across all three integrations
3. Explore cost savings and compliance status

**Option B: Test APIs Directly**
```bash
# Energy Pricing
curl "http://localhost:3000/api/energy-pricing?zone=US-CAL-CISO&zipCode=94102"

# Industry Benchmarks
curl "http://localhost:3000/api/industry-benchmarks?sector=manufacturing&country=USA"

# Compliance
curl "http://localhost:3000/api/compliance?region=EU&isSME=true"
```

---

## 💡 Use Cases

### For SMEs
- **Cost Reduction**: Identify optimal times for energy-intensive operations
- **Competitive Positioning**: Benchmark sustainability vs. industry peers
- **Regulatory Readiness**: Track compliance deadlines and requirements

### For Enterprises
- **Portfolio Optimization**: Multi-site energy cost analysis
- **ESG Reporting**: Automated data collection for sustainability reports
- **Supply Chain**: Assess supplier compliance with regulations

### For Consultants
- **Client Benchmarking**: Show clients how they compare to industry
- **Compliance Advisory**: Track multiple frameworks across client portfolios
- **ROI Calculations**: Quantify cost savings from sustainability initiatives

---

## 📈 Data Accuracy & Freshness

### Energy Pricing
- **Electricity Maps**: 15-minute updates, near real-time
- **OpenEI**: Annual utility rate updates
- **Forecasts**: 72-hour carbon intensity predictions

### Industry Benchmarks
- **Climate TRACE**: 2015-2024 annual data (monthly updates planned)
- **WikiRate**: Real-time community contributions
- **Fallback Data**: Used when APIs unavailable

### Compliance Tracker
- **Update Frequency**: Quarterly reviews
- **Data Sources**: Official EU/US/UK government publications
- **Latest Update**: November 2025

---

## 🔒 Security & Privacy

### API Key Storage
- All API keys stored in `.env` (never committed to git)
- Server-side only (Next.js API routes)
- No client-side exposure

### Data Handling
- No personal data sent to third-party APIs
- Aggregated emissions data only
- GDPR compliant

### Rate Limiting
- Electricity Maps: 30 req/day (free tier)
- OpenEI: No limits
- Climate TRACE: Unlimited bulk downloads
- WikiRate: Fair use policy

---

## 🛠️ Troubleshooting

### "Unable to fetch carbon intensity data"
- **Check**: `ELECTRICITY_MAPS_API_KEY` is set in `.env`
- **Verify**: API key is valid (test at portal.electricitymaps.com)
- **Confirm**: Zone code is correct (e.g., `US-CAL-CISO`, not `California`)
- **Fallback**: App continues with limited data if API unavailable

### "Unable to fetch utility rates"
- **Check**: `OPENEI_API_KEY` is set
- **Verify**: ZIP code is valid US postal code
- **Note**: Only US utilities supported by OpenEI

### "Using fallback data" for benchmarks
- **Normal**: Climate TRACE API is CSV-based, app uses cached data
- **Impact**: Benchmarks still functional with mock sector averages
- **Update**: Refresh data by re-fetching from climatetrace.org

### 502/504 Errors on API Routes
- **Cause**: Third-party API timeout (10-15s limit)
- **Solution**: Retry request or use cached data
- **Prevention**: Implement request caching (future enhancement)

---

## 📚 Additional Resources

### Documentation Links
- [Electricity Maps API Docs](https://portal.electricitymaps.com/developer-hub/api/getting-started)
- [OpenEI API Reference](https://developer.nrel.gov/docs/electricity/openei-utility-rates/)
- [Climate TRACE Data Portal](https://climatetrace.org/data)
- [WikiRate API Guide](https://wikirate.org/use_the_API)

### Regulatory Resources
- [CSRD Timeline](https://www.integritynext.com/csrd-timeline)
- [EU CBAM Portal](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en)
- [SEC Climate Rule](https://www.sec.gov/news/statement/lee-climate-disclosure-rulemaking-statement-030524)

### Support
- GitHub Issues: [Report bugs or request features]
- Documentation: Check `/INTEGRATIONS.md` for updates
- Community: Join sustainability developer forums

---

## 🎉 What's Next?

### Planned Enhancements
- ✅ Real-time alerts for optimal energy pricing
- ✅ Automated compliance report generation
- ✅ Multi-site benchmarking for enterprises
- ✅ Historical trend visualization (6-12 months)
- ✅ Custom benchmark groups for peer comparison

### Future Integrations
- ENTSO-E (European energy markets)
- GridStatus (US ISO real-time data)
- UK Carbon Intensity API
- Nord Pool (Nordic energy pricing)

---

**Last Updated**: November 16, 2025  
**Version**: 1.0.0  
**Maintained by**: VerdeIQ Team
