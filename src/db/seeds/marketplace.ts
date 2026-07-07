import { db } from "@/db";
import { offsetProjects } from "@/db/schema";

const projects = [
  {
    name: "Amazon Rainforest Conservation",
    description: "Protect 50,000 hectares of pristine Amazon rainforest through community-based conservation. This project prevents deforestation while supporting indigenous communities with sustainable livelihoods and education programs.",
    category: "forestry",
    location: "Acre, Brazil",
    certification: "Verra VCS",
    pricePerTon: 18.5,
    totalCapacityTons: 500000,
    availableTons: 425000,
    projectStartDate: "2020-01-15",
    projectEndDate: "2040-12-31",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_removed: 75000,
      trees_protected: 12500000,
      biodiversity_species: 3400,
      communities_supported: 45
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([13, 15, 1, 8]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Kenya Wind Farm Initiative",
    description: "Large-scale wind energy project generating clean electricity for 500,000 homes. Displaces fossil fuel energy and creates local employment opportunities while reducing grid emissions by 350,000 tons annually.",
    category: "renewable_energy",
    location: "Turkana County, Kenya",
    certification: "Gold Standard",
    pricePerTon: 12.0,
    totalCapacityTons: 700000,
    availableTons: 600000,
    projectStartDate: "2019-06-01",
    projectEndDate: "2044-05-31",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      renewable_mwh: 1200000,
      homes_powered: 500000,
      jobs_created: 280,
      coal_displaced_tons: 350000
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([7, 13, 8, 9]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Direct Air Capture Facility - Iceland",
    description: "Advanced carbon capture technology removes CO2 directly from the atmosphere and stores it permanently in basalt rock formations. Powered entirely by renewable geothermal energy.",
    category: "carbon_capture",
    location: "Hellisheiði, Iceland",
    certification: "Climate Action Reserve",
    pricePerTon: 45.0,
    totalCapacityTons: 100000,
    availableTons: 85000,
    projectStartDate: "2021-09-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_captured: 15000,
      storage_permanence_years: 1000,
      renewable_powered: true,
      technology: "Direct Air Capture"
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([13, 9, 12]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Mangrove Restoration - Indonesia",
    description: "Restore 10,000 hectares of coastal mangrove forests that protect shorelines, sequester carbon, and provide critical habitat for marine life. Involves local fishing communities in planting and monitoring.",
    category: "ocean_conservation",
    location: "Sumatra, Indonesia",
    certification: "Verra VCS",
    pricePerTon: 22.0,
    totalCapacityTons: 250000,
    availableTons: 180000,
    projectStartDate: "2020-03-01",
    projectEndDate: "2050-02-28",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_sequestered: 70000,
      mangroves_planted: 25000000,
      coastline_protected_km: 120,
      fish_habitat_hectares: 10000
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 14, 15, 1]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Solar Energy Cooperative - India",
    description: "Community-owned solar installation bringing clean energy to rural villages. Replaces diesel generators and kerosene lamps while providing electricity access to 100,000 people for the first time.",
    category: "renewable_energy",
    location: "Rajasthan, India",
    certification: "Gold Standard",
    pricePerTon: 10.5,
    totalCapacityTons: 400000,
    availableTons: 350000,
    projectStartDate: "2018-11-01",
    projectEndDate: "2043-10-31",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      renewable_mwh: 850000,
      people_served: 100000,
      diesel_displaced_liters: 5000000,
      villages_electrified: 85
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([7, 13, 1, 11]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Peatland Restoration - Scotland",
    description: "Restore degraded peatlands to their natural carbon-storing state. Peatlands are one of the most effective carbon sinks, storing twice as much carbon as all forests combined when healthy.",
    category: "forestry",
    location: "Scottish Highlands, UK",
    certification: "Verra VCS",
    pricePerTon: 28.0,
    totalCapacityTons: 180000,
    availableTons: 150000,
    projectStartDate: "2021-04-01",
    projectEndDate: "2051-03-31",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_sequestered: 30000,
      peatland_restored_hectares: 5000,
      water_quality_improved: true,
      rare_species_protected: 12
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 15, 6]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Biochar Production - United States",
    description: "Convert agricultural waste into biochar that permanently stores carbon while improving soil health. Supports regenerative agriculture practices across 500 farms.",
    category: "carbon_capture",
    location: "Iowa, USA",
    certification: "Climate Action Reserve",
    pricePerTon: 35.0,
    totalCapacityTons: 150000,
    availableTons: 120000,
    projectStartDate: "2020-07-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_captured: 30000,
      biochar_produced_tons: 50000,
      farms_supported: 500,
      soil_health_improvement: "30%"
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 2, 12]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Blue Carbon - Australia",
    description: "Protect and restore seagrass meadows that capture carbon 35x faster than tropical rainforests. Critical habitat for endangered dugongs and sea turtles.",
    category: "ocean_conservation",
    location: "Great Barrier Reef, Australia",
    certification: "Gold Standard",
    pricePerTon: 38.0,
    totalCapacityTons: 200000,
    availableTons: 175000,
    projectStartDate: "2019-08-01",
    projectEndDate: "2049-07-31",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_sequestered: 25000,
      seagrass_hectares: 8000,
      marine_species_protected: 450,
      water_clarity_improved: true
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([14, 13, 15]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Reforestation Program - Madagascar",
    description: "Plant 15 million native trees to restore degraded forests and protect unique lemur habitats. Provides sustainable income for local communities through agroforestry.",
    category: "forestry",
    location: "Eastern Madagascar",
    certification: "Verra VCS",
    pricePerTon: 16.0,
    totalCapacityTons: 350000,
    availableTons: 310000,
    projectStartDate: "2019-02-01",
    projectEndDate: "2044-01-31",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      co2_removed: 40000,
      trees_planted: 15000000,
      lemur_species_protected: 18,
      families_employed: 1200
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 15, 1, 8]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    name: "Geothermal Energy - Costa Rica",
    description: "Harness volcanic geothermal energy to provide baseload renewable power. Helps Costa Rica maintain its position as a global leader in clean energy with 99% renewable electricity.",
    category: "renewable_energy",
    location: "Guanacaste, Costa Rica",
    certification: "Gold Standard",
    pricePerTon: 14.5,
    totalCapacityTons: 300000,
    availableTons: 250000,
    projectStartDate: "2020-10-01",
    projectEndDate: "2045-09-30",
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      renewable_mwh: 600000,
      grid_stability_contribution: true,
      fossil_fuel_displaced_tons: 50000,
      technical_training_provided: 150
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([7, 13, 9]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function seedMarketplace() {
  console.log("🌱 Seeding marketplace projects...");
  
  try {
    // Clear existing projects
    await db.delete(offsetProjects);
    
    // Insert new projects
    await db.insert(offsetProjects).values(projects);
    
    console.log(`✅ Successfully seeded ${projects.length} marketplace projects`);
  } catch (error) {
    console.error("❌ Error seeding marketplace:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMarketplace()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
