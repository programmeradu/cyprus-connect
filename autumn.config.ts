import { feature, product, priceItem, featureItem } from "atmn";

export const aiCredits = feature({
  id: "ai_credits",
  name: "AI Credits",
  type: "single_use",
});

export const sustainabilityReports = feature({
  id: "sustainability_reports",
  name: "Sustainability Reports",
  type: "single_use",
});

export const userSeats = feature({
  id: "user_seats",
  name: "Multi-User Accounts",
  type: "continuous_use",
});

export const basicCarbonTracking = feature({
  id: "basic_carbon_tracking",
  name: "Basic Carbon Footprint Tracking",
  type: "boolean",
});

export const communitySupport = feature({
  id: "community_support",
  name: "Community Support",
  type: "boolean",
});

export const learningResources = feature({
  id: "learning_resources",
  name: "Access to Learning Resources",
  type: "boolean",
});

export const advancedCarbonAnalytics = feature({
  id: "advanced_carbon_analytics",
  name: "Advanced Carbon Analytics",
  type: "boolean",
});

export const realtimeClimateData = feature({
  id: "realtime_climate_data",
  name: "Real-time Climate Data Access",
  type: "boolean",
});

export const industryBenchmarking = feature({
  id: "industry_benchmarking",
  name: "Industry Benchmarking",
  type: "boolean",
});

export const priorityEmailSupport = feature({
  id: "priority_email_support",
  name: "Priority Email Support",
  type: "boolean",
});

export const customReportBranding = feature({
  id: "custom_report_branding",
  name: "Custom Report Branding",
  type: "boolean",
});

export const apiAccess = feature({
  id: "api_access",
  name: "API Access for Integrations",
  type: "boolean",
});

export const whiteLabelReports = feature({
  id: "white_label_reports",
  name: "White-label Reports",
  type: "boolean",
});

export const dedicatedAccountManager = feature({
  id: "dedicated_account_manager",
  name: "Dedicated Account Manager",
  type: "boolean",
});

export const customComplianceTracking = feature({
  id: "custom_compliance_tracking",
  name: "Custom Compliance Tracking",
  type: "boolean",
});

export const advancedAnalyticsDashboard = feature({
  id: "advanced_analytics_dashboard",
  name: "Advanced Analytics Dashboard",
  type: "boolean",
});

export const fullPlatformAccess = feature({
  id: "full_platform_access",
  name: "Full Platform Access",
  type: "boolean",
});

export const free = product({
  id: "free",
  name: "Free",
  is_default: true,
  items: [
    featureItem({
      feature_id: aiCredits.id,
      included_usage: 50,
      interval: "month",
    }),
    featureItem({
      feature_id: sustainabilityReports.id,
      included_usage: 1,
      interval: "month",
    }),
    featureItem({
      feature_id: basicCarbonTracking.id,
    }),
    featureItem({
      feature_id: communitySupport.id,
    }),
    featureItem({
      feature_id: learningResources.id,
    }),
  ],
});

export const professional = product({
  id: "professional",
  name: "Professional",
  items: [
    priceItem({
      price: 49,
      interval: "month",
    }),
    featureItem({
      feature_id: aiCredits.id,
      included_usage: 500,
      interval: "month",
    }),
    featureItem({
      feature_id: sustainabilityReports.id,
      included_usage: -1,
    }),
    featureItem({
      feature_id: advancedCarbonAnalytics.id,
    }),
    featureItem({
      feature_id: realtimeClimateData.id,
    }),
    featureItem({
      feature_id: industryBenchmarking.id,
    }),
    featureItem({
      feature_id: priorityEmailSupport.id,
    }),
    featureItem({
      feature_id: customReportBranding.id,
    }),
  ],
});

export const enterprise = product({
  id: "enterprise",
  name: "Enterprise",
  items: [
    priceItem({
      price: 199,
      interval: "month",
    }),
    featureItem({
      feature_id: aiCredits.id,
      included_usage: -1,
    }),
    featureItem({
      feature_id: sustainabilityReports.id,
      included_usage: -1,
    }),
    featureItem({
      feature_id: userSeats.id,
      included_usage: 10,
    }),
    featureItem({
      feature_id: apiAccess.id,
    }),
    featureItem({
      feature_id: whiteLabelReports.id,
    }),
    featureItem({
      feature_id: dedicatedAccountManager.id,
    }),
    featureItem({
      feature_id: customComplianceTracking.id,
    }),
    featureItem({
      feature_id: advancedAnalyticsDashboard.id,
    }),
    featureItem({
      feature_id: fullPlatformAccess.id,
    }),
  ],
});

export const credits100 = product({
  id: "credits_100",
  name: "100 AI Credits",
  is_add_on: true,
  items: [
    priceItem({
      price: 10,
    }),
    featureItem({
      feature_id: aiCredits.id,
      included_usage: 100,
    }),
  ],
});

export const credits500 = product({
  id: "credits_500",
  name: "500 AI Credits",
  is_add_on: true,
  items: [
    priceItem({
      price: 40,
    }),
    featureItem({
      feature_id: aiCredits.id,
      included_usage: 500,
    }),
  ],
});

export const credits1000 = product({
  id: "credits_1000",
  name: "1000 AI Credits",
  is_add_on: true,
  items: [
    priceItem({
      price: 75,
    }),
    featureItem({
      feature_id: aiCredits.id,
      included_usage: 1000,
    }),
  ],
});

// @ts-ignore
const config = {
  credits: [
    {
      id: 'credits100',
      amount: 9.99,
      credits: 100,
      priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_100_PRICE_ID!,
    },
    {
      id: 'credits500',
      amount: 39.99,
      credits: 500,
      priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_500_PRICE_ID!,
    },
    {
      id: 'credits1000',
      amount: 69.99,
      credits: 1000,
      priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_1000_PRICE_ID!,
    },
  ],
};