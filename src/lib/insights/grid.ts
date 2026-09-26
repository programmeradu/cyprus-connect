/**
 * Today's grid, from Energy-Charts (Fraunhofer ISE) measured hourly data.
 *
 * Pure parsing so it is tested without a network. Only measured hours are
 * used: Energy-Charts publishes no forecast for Cyprus, so none is shown.
 */

export interface GridHour {
  /** ISO time of the start of the hour. */
  at: string;
  /** g CO2e per kWh of electricity generated. */
  grams: number;
}

export interface GridToday {
  country: string;
  hours: GridHour[];
  latest: GridHour;
  cleanest: GridHour;
  dirtiest: GridHour;
  /** Renewable share of load in the latest hour, percent; null if not published. */
  renewableShare: number | null;
  source: string;
}

interface Co2Payload {
  unix_seconds?: unknown;
  co2eq?: unknown;
}
interface PowerPayload {
  unix_seconds?: unknown;
  production_types?: Array<{ name?: unknown; data?: unknown }>;
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** Builds today's picture, or null when the payload has no usable hours. */
export function parseGrid(country: string, co2: Co2Payload, power: PowerPayload | null): GridToday | null {
  const times = Array.isArray(co2.unix_seconds) ? co2.unix_seconds : [];
  const values = Array.isArray(co2.co2eq) ? co2.co2eq : [];
  const hours: GridHour[] = [];
  for (let i = 0; i < Math.min(times.length, values.length); i++) {
    const t = num(times[i]);
    const g = num(values[i]);
    if (t === null || g === null || g < 0 || g > 2000) continue;
    hours.push({ at: new Date(t * 1000).toISOString(), grams: g });
  }
  if (hours.length === 0) return null;

  let cleanest = hours[0];
  let dirtiest = hours[0];
  for (const h of hours) {
    if (h.grams < cleanest.grams) cleanest = h;
    if (h.grams > dirtiest.grams) dirtiest = h;
  }

  let renewableShare: number | null = null;
  const share = power?.production_types?.find((p) => p.name === "Renewable share of load");
  if (share && Array.isArray(share.data)) {
    for (let i = share.data.length - 1; i >= 0; i--) {
      const v = num(share.data[i]);
      if (v !== null && v >= 0 && v <= 100) {
        renewableShare = v;
        break;
      }
    }
  }

  return {
    country,
    hours,
    latest: hours[hours.length - 1],
    cleanest,
    dirtiest,
    renewableShare,
    source: "Energy-Charts, Fraunhofer ISE (measured public generation)",
  };
}

/** Grams avoided per kWh moved from the dirtiest to the cleanest hour today. */
export function shiftGain(grid: GridToday): number {
  return Math.max(0, grid.dirtiest.grams - grid.cleanest.grams);
}
