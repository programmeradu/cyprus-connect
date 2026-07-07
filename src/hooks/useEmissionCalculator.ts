import { useState, useCallback } from "react";

interface CalculationInput {
  activity_id: string;
  value: number;
  unit: string;
  region?: string;
  year?: number;
}

interface CalculationResult {
  activity_id: string;
  input_value: number;
  input_unit: string;
  co2e_kg: number;
  co2e_tonnes: number;
  co2e_kg_rounded: number;
  calculation_method: string;
  calculation_origin: string;
  timestamp: string;
}

interface BatchCalculationInput {
  electricity_kwh?: number;
  gas_m3?: number;
  water_liters?: number;
  waste_kg?: number;
  transport_km?: number;
  region?: string;
}

interface BatchCalculationResult {
  total_co2e_kg: number;
  total_co2e_tonnes: number;
  total_co2e_tonnes_rounded: number;
  breakdown: Array<{
    category: string;
    input_value: number;
    input_unit: string;
    co2e_kg: number;
    co2e_tonnes: number;
    activity_id: string;
  }>;
  timestamp: string;
}

export function useEmissionCalculator() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculate = useCallback(async (input: CalculationInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/emissions/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Calculation failed");
      }

      const { data } = await response.json();
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateBatch = useCallback(async (input: BatchCalculationInput) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/emissions/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Batch calculation failed");
      }

      const { data } = await response.json();
      return data as BatchCalculationResult;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { calculate, calculateBatch, loading, error, result };
}
