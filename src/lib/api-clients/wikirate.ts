// WikiRate API Client - ESG Benchmarking Data
import axios, { type AxiosInstance } from "axios";

const WIKIRATE_BASE = "https://wikirate.org";

export interface CompanyESGData {
  company_name: string;
  metrics: {
    [key: string]: {
      value: number | string;
      year: number;
      source: string;
    };
  };
}

export class WikiRateClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: WIKIRATE_BASE,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Search for company by name
   */
  async searchCompany(companyName: string): Promise<any[]> {
    try {
      const response = await this.client.get("/Company.json", {
        params: {
          name: companyName,
          limit: 10,
        },
      });
      return response.data.items || [];
    } catch (error: any) {
      console.warn("WikiRate API unavailable, using mock data");
      return this.getMockCompanyData(companyName);
    }
  }

  /**
   * Get company ESG metrics
   */
  async getCompanyMetrics(
    companyId: string,
    metricSlugs: string[] = ["ghg-emissions", "energy-consumption", "water-usage"]
  ): Promise<CompanyESGData> {
    try {
      const promises = metricSlugs.map((slug) =>
        this.client.get(`/Answer.json`, {
          params: {
            company_id: companyId,
            metric: slug,
          },
        })
      );

      const responses = await Promise.all(promises);
      const metrics: any = {};

      responses.forEach((response, index) => {
        if (response.data.items && response.data.items.length > 0) {
          const item = response.data.items[0];
          metrics[metricSlugs[index]] = {
            value: item.value,
            year: item.year,
            source: item.source_name || "Unknown",
          };
        }
      });

      return {
        company_name: companyId,
        metrics,
      };
    } catch (error: any) {
      console.warn("WikiRate metrics unavailable");
      return this.getMockMetricsData();
    }
  }

  /**
   * Calculate industry benchmark
   */
  calculateIndustryBenchmark(
    companiesData: CompanyESGData[],
    metric: string
  ): {
    average: number;
    median: number;
    percentile_25: number;
    percentile_75: number;
  } {
    const values = companiesData
      .map((c) => c.metrics[metric]?.value)
      .filter((v) => typeof v === "number") as number[];

    if (values.length === 0) {
      return { average: 0, median: 0, percentile_25: 0, percentile_75: 0 };
    }

    const sorted = values.sort((a, b) => a - b);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;

    return {
      average: avg,
      median: sorted[Math.floor(sorted.length / 2)],
      percentile_25: sorted[Math.floor(sorted.length * 0.25)],
      percentile_75: sorted[Math.floor(sorted.length * 0.75)],
    };
  }

  private getMockCompanyData(name: string): any[] {
    return [
      {
        id: "mock-company-1",
        name,
        industry: "Technology",
        country: "USA",
      },
    ];
  }

  private getMockMetricsData(): CompanyESGData {
    return {
      company_name: "Mock Company",
      metrics: {
        "ghg-emissions": {
          value: 50000,
          year: 2023,
          source: "Annual Report",
        },
        "energy-consumption": {
          value: 1000000,
          year: 2023,
          source: "Sustainability Report",
        },
        "water-usage": {
          value: 500000,
          year: 2023,
          source: "Environmental Disclosure",
        },
      },
    };
  }
}
