import { db } from '../index';
import { offsetProjects } from '../schema';

const projects = [
  // Forestry Projects
  {
    name: "Amazon Rainforest Protection Initiative",
    description: "Protecting 50,000 hectares of pristine Amazon rainforest through community-led conservation programs. This project prevents deforestation by providing sustainable economic alternatives to local communities while preserving biodiversity hotspots.",
    category: "forestry",
    location: "Amazonas, Brazil",
    certification: "Gold Standard",
    pricePerTon: 12,
    totalCapacityTons: 500000,
    availableTons: 500000,
    projectStartDate: "2020-01-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      jobs_created: 200,
      area_protected_hectares: 50000,
      biodiversity_species_protected: 2500,
      local_families_supported: 150
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([13, 15, 8, 17]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Mangrove Restoration Initiative",
    description: "Restoring 25,000 hectares of coastal mangrove ecosystems that serve as critical carbon sinks and protect coastlines from erosion and storms. This project also provides nursery habitats for marine life.",
    category: "forestry",
    location: "Sumatra, Indonesia",
    certification: "Verra VCS",
    pricePerTon: 15,
    totalCapacityTons: 300000,
    availableTons: 300000,
    projectStartDate: "2019-06-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      jobs_created: 150,
      area_restored_hectares: 25000,
      coastal_protection_km: 100,
      marine_species_protected: 800
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 14, 15, 1]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Sustainable Forestry Management Kenya",
    description: "Managing 40,000 hectares of forest land using sustainable practices that balance carbon sequestration with local community needs. The project includes reforestation and improved forest management techniques.",
    category: "forestry",
    location: "Nairobi Region, Kenya",
    certification: "Climate Action Reserve",
    pricePerTon: 10,
    totalCapacityTons: 400000,
    availableTons: 400000,
    projectStartDate: "2018-03-15",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      jobs_created: 180,
      area_managed_hectares: 40000,
      trees_planted: 500000,
      water_sources_protected: 12
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 15, 6, 8]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Renewable Energy Projects
  {
    name: "Solar Farm Network India",
    description: "A network of solar farms across rural India providing clean energy to 200,000 homes while displacing coal-fired electricity generation. The project includes training programs for local solar technicians.",
    category: "renewable_energy",
    location: "Rajasthan, India",
    certification: "Gold Standard",
    pricePerTon: 8,
    totalCapacityTons: 800000,
    availableTons: 800000,
    projectStartDate: "2021-01-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      capacity_mw: 500,
      homes_powered: 200000,
      jobs_created: 300,
      coal_displaced_tons: 400000
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([7, 13, 8, 9]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Wind Energy Development Morocco",
    description: "Large-scale wind farm development in Morocco's Atlantic coast, generating 300 MW of clean energy and reducing the country's reliance on fossil fuel imports.",
    category: "renewable_energy",
    location: "Tangier, Morocco",
    certification: "Verra VCS",
    pricePerTon: 9,
    totalCapacityTons: 600000,
    availableTons: 600000,
    projectStartDate: "2020-09-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      capacity_mw: 300,
      homes_powered: 150000,
      jobs_created: 120,
      fossil_fuel_avoided_tons: 350000
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([7, 13, 9, 12]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Hydroelectric Modernization Costa Rica",
    description: "Modernizing existing hydroelectric facilities to increase efficiency and generation capacity while maintaining ecological flow in protected river systems.",
    category: "renewable_energy",
    location: "Central Valley, Costa Rica",
    certification: "Climate Action Reserve",
    pricePerTon: 11,
    totalCapacityTons: 450000,
    availableTons: 450000,
    projectStartDate: "2019-11-15",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      capacity_mw: 200,
      homes_powered: 100000,
      efficiency_increase_percent: 25,
      river_ecosystems_protected: 8
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([7, 13, 6, 15]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Carbon Capture Projects
  {
    name: "Direct Air Capture Facility Iceland",
    description: "State-of-the-art direct air capture technology powered by geothermal energy, removing CO2 directly from the atmosphere and mineralizing it underground for permanent storage.",
    category: "carbon_capture",
    location: "Reykjavik, Iceland",
    certification: "Gold Standard",
    pricePerTon: 150,
    totalCapacityTons: 100000,
    availableTons: 100000,
    projectStartDate: "2022-01-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      capture_capacity_tons_per_year: 10000,
      jobs_created: 50,
      storage_permanence_years: 1000,
      renewable_energy_percent: 100
    }),
    imageUrl: null,
    isFeatured: true,
    sdgGoals: JSON.stringify([13, 7, 9, 12]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Biochar Production System USA",
    description: "Converting agricultural waste into biochar through pyrolysis, sequestering carbon while improving soil health and reducing the need for chemical fertilizers.",
    category: "carbon_capture",
    location: "California, USA",
    certification: "Verra VCS",
    pricePerTon: 120,
    totalCapacityTons: 80000,
    availableTons: 80000,
    projectStartDate: "2021-06-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      biomass_processed_tons_per_year: 5000,
      jobs_created: 40,
      agricultural_waste_diverted_tons: 8000,
      soil_improvement_hectares: 2000
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 2, 12, 15]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Enhanced Weathering Program Australia",
    description: "Applying crushed silicate rocks to agricultural land to accelerate natural weathering processes that capture and store atmospheric CO2, while improving soil pH and crop yields.",
    category: "carbon_capture",
    location: "Queensland, Australia",
    certification: "Climate Action Reserve",
    pricePerTon: 100,
    totalCapacityTons: 120000,
    availableTons: 120000,
    projectStartDate: "2020-08-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      area_treated_hectares: 100000,
      jobs_created: 30,
      crop_yield_increase_percent: 15,
      soil_ph_improvement: 0.5
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 2, 12, 15]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  // Ocean Conservation Projects
  {
    name: "Seagrass Meadow Restoration Philippines",
    description: "Restoring 15,000 hectares of seagrass meadows that sequester carbon 35 times faster than tropical rainforests while providing critical habitat for marine biodiversity.",
    category: "ocean_conservation",
    location: "Palawan, Philippines",
    certification: "Gold Standard",
    pricePerTon: 18,
    totalCapacityTons: 250000,
    availableTons: 250000,
    projectStartDate: "2019-04-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      area_restored_hectares: 15000,
      jobs_created: 100,
      marine_species_supported: 1200,
      fishing_communities_benefited: 80
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 14, 1, 2]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Blue Carbon Coastal Protection Vietnam",
    description: "Protecting and restoring 20,000 hectares of coastal blue carbon ecosystems including mangroves, seagrasses, and salt marshes that sequester and store carbon while protecting communities from storms.",
    category: "ocean_conservation",
    location: "Mekong Delta, Vietnam",
    certification: "Verra VCS",
    pricePerTon: 16,
    totalCapacityTons: 300000,
    availableTons: 300000,
    projectStartDate: "2018-10-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      area_protected_hectares: 20000,
      jobs_created: 120,
      coastline_protected_km: 150,
      storm_surge_reduction_percent: 40
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 14, 11, 1]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    name: "Marine Protected Area Expansion Madagascar",
    description: "Expanding and managing marine protected areas covering 30,000 hectares of coral reefs, seagrass beds, and coastal ecosystems that store significant amounts of blue carbon.",
    category: "ocean_conservation",
    location: "Nosy Be, Madagascar",
    certification: "Climate Action Reserve",
    pricePerTon: 14,
    totalCapacityTons: 350000,
    availableTons: 350000,
    projectStartDate: "2020-02-01",
    projectEndDate: null,
    verificationStatus: "verified",
    impactMetrics: JSON.stringify({
      area_protected_hectares: 30000,
      jobs_created: 90,
      coral_reef_health_improvement_percent: 30,
      endangered_species_protected: 15
    }),
    imageUrl: null,
    isFeatured: false,
    sdgGoals: JSON.stringify([13, 14, 15, 8]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function seed() {
  console.log('🌱 Seeding marketplace projects...');
  
  try {
    // Insert all projects
    await db.insert(offsetProjects).values(projects);
    
    console.log('✅ Successfully seeded', projects.length, 'marketplace projects');
  } catch (error) {
    console.error('❌ Error seeding marketplace projects:', error);
    throw error;
  }
}

seed();
