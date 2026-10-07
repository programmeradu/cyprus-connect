-- Table for hospitality facility configurations and HCMI metrics (scripts/sql/0046)
CREATE TABLE IF NOT EXISTS hospitality_profiles (
  id SERIAL PRIMARY KEY,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  property_name TEXT NOT NULL,
  hotel_category TEXT NOT NULL DEFAULT '4-star', -- 'luxury' | '5-star' | '4-star' | '3-star' | 'boutique' | 'resort'
  total_rooms INTEGER NOT NULL DEFAULT 50,
  annual_occupied_rooms INTEGER NOT NULL DEFAULT 12000,
  annual_guest_nights INTEGER NOT NULL DEFAULT 24000,
  has_pool BOOLEAN NOT NULL DEFAULT true,
  has_restaurant BOOLEAN NOT NULL DEFAULT true,
  has_spa BOOLEAN NOT NULL DEFAULT false,
  has_laundry_on_site BOOLEAN NOT NULL DEFAULT true,
  eco_label TEXT, -- 'Green Key' | 'EU Ecolabel' | 'Travelife' | 'None'
  tour_operator_partners TEXT, -- 'TUI, Jet2, DER Touristik'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitality_profiles_workspace ON hospitality_profiles(workspace_id);
