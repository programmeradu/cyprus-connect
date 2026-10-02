import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createStripeClient, StripeNotConfiguredError } from "@/lib/stripe/server";
import { MARKETPLACE_FEE_RATE } from "@/lib/stripe/config";
import { billingPageUrl, appBaseUrl, getOrCreateStripeCustomer } from "@/lib/stripe/utils";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('marketplace.purchase');

const bodySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  tons: z.number().finite().positive().max(1_000_000),
});

export async function POST(request: NextRequest) {
  try {
    const stripe = createStripeClient();
    // Get authenticated user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const bodyResult = await readJson(request, bodySchema);
    if (!bodyResult.ok) return bodyResult.response;
    const { projectId, tons } = bodyResult.data;

    // Get project details
    const project = await db
      .select()
      .from(offsetProjects)
      .where(eq(offsetProjects.id, projectId))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const projectData = project[0];

    // Check availability
    if (projectData.availableTons < tons) {
      return NextResponse.json(
        { error: "Insufficient tons available" },
        { status: 400 }
      );
    }

    // Registry-linked listings only (see marketplace memory); none are live yet.
    const unitAmount = Math.round(projectData.pricePerTon * 100);
    const quantity = Math.round(tons);
    const platformFeeCents = Math.round(unitAmount * quantity * MARKETPLACE_FEE_RATE);
    const customerId = await getOrCreateStripeCustomer(session.user.id, session.user.email);
    const meta = {
      userId: session.user.id,
      projectId: projectId.toString(),
      tons: String(quantity),
      type: "carbon_offset",
      platformFeeCents: String(platformFeeCents),
    };
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card", "sepa_debit"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${projectData.name} - carbon credits`,
              description: `${quantity} t CO2e, retired on the project's registry`,
              images: projectData.imageUrl?.startsWith("https://") ? [projectData.imageUrl] : [],
            },
            unit_amount: unitAmount,
          },
          quantity,
        },
      ],
      billing_address_collection: "required",
      customer_update: { address: "auto", name: "auto" },
      tax_id_collection: { enabled: true },
      invoice_creation: { enabled: true, invoice_data: { metadata: meta } },
      payment_intent_data: { description: `${projectData.name} - ${quantity} t CO2e`, metadata: meta },
      success_url: `${appBaseUrl(request)}/en/app/marketplace?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: billingPageUrl(request, "en").replace("/app/billing", "/app/marketplace") + "?canceled=true",
      metadata: meta,
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error) {
    if (error instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: 'Payments are not switched on yet.', code: "PAYMENTS_OFF" }, { status: 503 });
    }
    const ref = log.error("Error creating purchase", error);
    return NextResponse.json(
      { error: "Failed to create purchase.", ref },
      { status: 500 }
    );
  }
}
