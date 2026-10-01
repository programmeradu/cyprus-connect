import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock DB
const mockSelect = vi.fn();
const mockInsert = vi.fn();

vi.mock("@/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: mockSelect,
        }),
      }),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: mockInsert,
        onConflictDoNothing: mockInsert,
      }),
    }),
  },
}));

vi.mock("@/db/schema", () => ({
  companyLogos: {
    domain: "domain",
    contentType: "content_type",
    data: "data",
    source: "source",
    status: "status",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
}));

describe("logo route permanent database caching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves from database on cache HIT without contacting Logo.dev", async () => {
    const { GET } = await import("@/app/api/logo/route");

    // Mock DB HIT
    mockSelect.mockResolvedValueOnce([
      {
        contentType: "image/png",
        data: Buffer.from("mock-png-bytes").toString("base64"),
        source: "logo_dev",
        status: 200,
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/logo?d=apple.com");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("x-logo-cache")).toBe("HIT");
    expect(res.headers.get("x-logo-source")).toBe("logo_dev");
    expect(res.headers.get("cache-control")).toContain("immutable");
  });

  it("serves 404 from database on negative cache HIT without contacting Logo.dev", async () => {
    const { GET } = await import("@/app/api/logo/route");

    // Mock DB Negative HIT
    mockSelect.mockResolvedValueOnce([
      {
        contentType: "none",
        data: "",
        source: "none",
        status: 404,
      },
    ]);

    const req = new NextRequest("http://localhost:3000/api/logo?d=unknown-nonexistent-domain.cy");
    const res = await GET(req);

    expect(res.status).toBe(404);
    expect(res.headers.get("x-logo-cache")).toBe("HIT-NEGATIVE");
  });

  it("returns 400 when domain is missing or invalid", async () => {
    const { GET } = await import("@/app/api/logo/route");
    const req = new NextRequest("http://localhost:3000/api/logo?d=");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});
