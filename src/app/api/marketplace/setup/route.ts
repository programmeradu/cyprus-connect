import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Create offset_projects table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS offset_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        certification TEXT NOT NULL,
        price_per_ton REAL NOT NULL,
        total_capacity_tons REAL NOT NULL,
        available_tons REAL NOT NULL,
        project_start_date TEXT NOT NULL,
        project_end_date TEXT,
        verification_status TEXT NOT NULL,
        impact_metrics TEXT NOT NULL,
        image_url TEXT,
        is_featured INTEGER NOT NULL DEFAULT 0,
        sdg_goals TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Create offset_purchases table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS offset_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        project_id INTEGER NOT NULL,
        tons_purchased REAL NOT NULL,
        price_paid REAL NOT NULL,
        stripe_payment_id TEXT NOT NULL,
        certificate_url TEXT,
        certificate_number TEXT UNIQUE,
        status TEXT NOT NULL,
        purchased_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
        FOREIGN KEY (project_id) REFERENCES offset_projects(id) ON DELETE CASCADE
      )
    `);

    // Create user_impact_tracking table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_impact_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        total_tons_offset REAL NOT NULL DEFAULT 0,
        total_spent REAL NOT NULL DEFAULT 0,
        projects_supported INTEGER NOT NULL DEFAULT 0,
        first_purchase_at TEXT,
        last_purchase_at TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
      )
    `);

    // Check if projects already exist
    const existing = await db.execute(sql`SELECT COUNT(*) as count FROM offset_projects`);
    const existingCount = Number((existing as any)[0]?.count ?? 0);
    
    if (existingCount === 0) {
      const now = new Date().toISOString();
      
      // Seed projects one by one
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Amazon Rainforest Protection Initiative', 'Protecting 50,000 hectares of pristine Amazon rainforest through community-led conservation programs.', 'forestry', 'Amazonas, Brazil', 'Gold Standard', 12, 500000, 500000, '2020-01-01', 'verified', '{"jobs_created":200,"area_protected_hectares":50000}', 1, '[13,15,8,17]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Mangrove Restoration Initiative', 'Restoring 25,000 hectares of coastal mangrove ecosystems.', 'forestry', 'Sumatra, Indonesia', 'Verra VCS', 15, 300000, 300000, '2019-06-01', 'verified', '{"jobs_created":150,"area_restored_hectares":25000}', 0, '[13,14,15,1]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Sustainable Forestry Management Kenya', 'Managing 40,000 hectares of forest land using sustainable practices.', 'forestry', 'Nairobi, Kenya', 'Climate Action Reserve', 10, 400000, 400000, '2018-03-15', 'verified', '{"jobs_created":180,"area_managed_hectares":40000}', 0, '[13,15,6,8]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Solar Farm Network India', 'Solar farms providing clean energy to 200,000 homes.', 'renewable_energy', 'Rajasthan, India', 'Gold Standard', 8, 800000, 800000, '2021-01-01', 'verified', '{"capacity_mw":500,"homes_powered":200000}', 1, '[7,13,8,9]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Wind Energy Development Morocco', 'Large-scale wind farm generating 300 MW of clean energy.', 'renewable_energy', 'Tangier, Morocco', 'Verra VCS', 9, 600000, 600000, '2020-09-01', 'verified', '{"capacity_mw":300,"homes_powered":150000}', 0, '[7,13,9,12]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Hydroelectric Modernization Costa Rica', 'Modernizing hydroelectric facilities for increased efficiency.', 'renewable_energy', 'Central Valley, Costa Rica', 'Climate Action Reserve', 11, 450000, 450000, '2019-11-15', 'verified', '{"capacity_mw":200,"homes_powered":100000}', 0, '[7,13,6,15]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Direct Air Capture Facility Iceland', 'Direct air capture technology removing CO2 from atmosphere.', 'carbon_capture', 'Reykjavik, Iceland', 'Gold Standard', 150, 100000, 100000, '2022-01-01', 'verified', '{"capture_capacity_tons_per_year":10000,"jobs_created":50}', 1, '[13,7,9,12]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Biochar Production System USA', 'Converting agricultural waste into biochar.', 'carbon_capture', 'California, USA', 'Verra VCS', 120, 80000, 80000, '2021-06-01', 'verified', '{"biomass_processed_tons_per_year":5000,"jobs_created":40}', 0, '[13,2,12,15]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Enhanced Weathering Program Australia', 'Accelerating natural weathering to capture CO2.', 'carbon_capture', 'Queensland, Australia', 'Climate Action Reserve', 100, 120000, 120000, '2020-08-01', 'verified', '{"area_treated_hectares":100000,"jobs_created":30}', 0, '[13,2,12,15]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Seagrass Meadow Restoration Philippines', 'Restoring 15,000 hectares of seagrass meadows.', 'ocean_conservation', 'Palawan, Philippines', 'Gold Standard', 18, 250000, 250000, '2019-04-01', 'verified', '{"area_restored_hectares":15000,"jobs_created":100}', 0, '[13,14,1,2]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Blue Carbon Coastal Protection Vietnam', 'Protecting 20,000 hectares of coastal blue carbon ecosystems.', 'ocean_conservation', 'Mekong Delta, Vietnam', 'Verra VCS', 16, 300000, 300000, '2018-10-01', 'verified', '{"area_protected_hectares":20000,"jobs_created":120}', 0, '[13,14,11,1]', ${now}, ${now})`);
      
      await db.execute(sql`INSERT INTO offset_projects (name, description, category, location, certification, price_per_ton, total_capacity_tons, available_tons, project_start_date, verification_status, impact_metrics, is_featured, sdg_goals, created_at, updated_at) VALUES ('Marine Protected Area Expansion Madagascar', 'Expanding marine protected areas covering 30,000 hectares.', 'ocean_conservation', 'Nosy Be, Madagascar', 'Climate Action Reserve', 14, 350000, 350000, '2020-02-01', 'verified', '{"area_protected_hectares":30000,"jobs_created":90}', 0, '[13,14,15,8]', ${now}, ${now})`);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Marketplace tables created and seeded successfully" 
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Setup failed", details: error.message },
      { status: 500 }
    );
  }
}