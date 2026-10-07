import { NextResponse } from "next/server";
import { logger } from "@/lib/log";
import { loadVsmePassport } from "@/lib/reports/passport.server";
import { db } from "@/db";
import { vsmePassports } from "@/db/schema";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";
const log = logger("api.public.passport");

type Props = {
  params: Promise<{ identifier: string }>;
};

export async function GET(req: Request, { params }: Props) {
  const { identifier } = await params;
  const trimmed = (identifier || "").trim().toLowerCase();
  if (!trimmed) {
    return NextResponse.json({ message: "Identifier is required." }, { status: 400 });
  }

  try {
    // Lookup passport by slug or share token
    const [passportRow] = await db
      .select({ workspaceId: vsmePassports.workspaceId, isPublic: vsmePassports.isPublic })
      .from(vsmePassports)
      .where(or(eq(vsmePassports.slug, trimmed), eq(vsmePassports.shareToken, trimmed)))
      .limit(1);

    if (!passportRow) {
      return NextResponse.json({ message: "VSME Passport not found." }, { status: 404 });
    }

    if (!passportRow.isPublic) {
      return NextResponse.json({ message: "This passport is private." }, { status: 403 });
    }

    const data = await loadVsmePassport(passportRow.workspaceId, true);
    if (!data) {
      return NextResponse.json({ message: "Passport details unavailable." }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    const ref = log.error("public passport query failed", error);
    return NextResponse.json({ message: "Could not load passport.", ref }, { status: 500 });
  }
}
