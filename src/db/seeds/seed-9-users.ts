import { db } from "../index";
import { user } from "../schema";

// Generate a unique ID for users
function generateUserId() {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function seed9Users() {
  console.log("🌱 Seeding 9 diverse users...");

  const users = [
    {
      id: generateUserId(),
      email: "sarah.chen@ecotech.io",
      name: "Sarah Chen",
      emailVerified: true,
      companyName: "EcoTech Solutions",
      companyIndustry: "Technology",
      teamSize: "11-50",
      sustainabilityGoals: "Reduce carbon emissions by 40%",
      totalCredits: 2500,
      onboardingCompleted: true,
      preferredCurrency: "USD",
      countryCode: "US",
      timezone: "America/Los_Angeles",
      energyZone: "CAISO"
    },
    {
      id: generateUserId(),
      email: "kwame.mensah@greenbuild.gh",
      name: "Kwame Mensah",
      emailVerified: true,
      companyName: "GreenBuild Ghana",
      companyIndustry: "Construction",
      teamSize: "1-10",
      sustainabilityGoals: "Achieve net zero by 2030",
      totalCredits: 1200,
      onboardingCompleted: true,
      preferredCurrency: "GHS",
      countryCode: "GH",
      timezone: "Africa/Accra",
      energyZone: "ECG"
    },
    {
      id: generateUserId(),
      email: "emma.schmidt@sustainlog.de",
      name: "Emma Schmidt",
      emailVerified: true,
      companyName: "EcoLogistics GmbH",
      companyIndustry: "Transportation",
      teamSize: "51-200",
      sustainabilityGoals: "Carbon neutral fleet by 2025",
      totalCredits: 3800,
      onboardingCompleted: true,
      preferredCurrency: "EUR",
      countryCode: "DE",
      timezone: "Europe/Berlin",
      energyZone: "DE-LU"
    },
    {
      id: generateUserId(),
      email: "raj.patel@greenmanuf.in",
      name: "Raj Patel",
      emailVerified: true,
      companyName: "GreenManufacturing India",
      companyIndustry: "Manufacturing",
      teamSize: "51-200",
      sustainabilityGoals: "Implement circular economy model",
      totalCredits: 2100,
      onboardingCompleted: false,
      preferredCurrency: "INR",
      countryCode: "IN",
      timezone: "Asia/Kolkata",
      energyZone: "IN-WE"
    },
    {
      id: generateUserId(),
      email: "sophie.martin@vertcafe.fr",
      name: "Sophie Martin",
      emailVerified: true,
      companyName: "Vert Café",
      companyIndustry: "Food & Beverage",
      teamSize: "1-10",
      sustainabilityGoals: "Zero waste operations",
      totalCredits: 800,
      onboardingCompleted: true,
      preferredCurrency: "EUR",
      countryCode: "FR",
      timezone: "Europe/Paris",
      energyZone: "FR"
    },
    {
      id: generateUserId(),
      email: "james.wilson@ecostay.ca",
      name: "James Wilson",
      emailVerified: true,
      companyName: "EcoStay Hotels",
      companyIndustry: "Hospitality",
      teamSize: "11-50",
      sustainabilityGoals: "Green building certification",
      totalCredits: 1900,
      onboardingCompleted: true,
      preferredCurrency: "CAD",
      countryCode: "CA",
      timezone: "America/Toronto",
      energyZone: "IESO"
    },
    {
      id: generateUserId(),
      email: "amara.okafor@afritech.ng",
      name: "Amara Okafor",
      emailVerified: true,
      companyName: "AfriTech Solutions",
      companyIndustry: "Technology",
      teamSize: "11-50",
      sustainabilityGoals: "100% renewable energy by 2026",
      totalCredits: 1500,
      onboardingCompleted: false,
      preferredCurrency: "USD",
      countryCode: "NG",
      timezone: "Africa/Lagos",
      energyZone: "PHCN"
    },
    {
      id: generateUserId(),
      email: "liu.wei@greenthreads.cn",
      name: "Liu Wei",
      emailVerified: true,
      companyName: "Green Threads",
      companyIndustry: "Retail",
      teamSize: "11-50",
      sustainabilityGoals: "Sustainable supply chain",
      totalCredits: 2200,
      onboardingCompleted: true,
      preferredCurrency: "USD",
      countryCode: "CN",
      timezone: "Asia/Shanghai",
      energyZone: "CN-GD"
    },
    {
      id: generateUserId(),
      email: "oliver.bennett@renewconsult.uk",
      name: "Oliver Bennett",
      emailVerified: true,
      companyName: "RenewConsult Ltd",
      companyIndustry: "Consulting",
      teamSize: "1-10",
      sustainabilityGoals: "Help 50 companies achieve carbon neutrality",
      totalCredits: 3200,
      onboardingCompleted: true,
      preferredCurrency: "GBP",
      countryCode: "GB",
      timezone: "Europe/London",
      energyZone: "GB"
    }
  ];

  for (const userData of users) {
    await db.insert(user).values(userData);
    console.log(`✅ Created user: ${userData.name} (${userData.email})`);
  }

  console.log("🎉 Successfully seeded 9 users!");
}

seed9Users()
  .then(() => {
    console.log("✅ Seeding complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });