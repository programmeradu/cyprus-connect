import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

// GDPR Article 15 / 20 — right of access & portability.
// Returns a machine-readable JSON export of the authenticated user's data.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Authenticate the caller and ensure they own this record.
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.id !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
    if (rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Redact any secret / hashed fields.
    const record = { ...rows[0] } as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (/password|token|secret/i.test(key)) delete record[key];
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      subject: "GDPR data export (Article 15 / 20)",
      controller: "Verde IQ, Strovolos, Cyprus",
      contact: "samuel@stauniverse.tech",
      data: { profile: record },
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="vuneli-data-export-${id}.json"`,
      },
    });
  } catch (error) {
    console.error("export error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 },
    );
  }
}
