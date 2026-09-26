import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { offsetProjects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Stripe from "stripe";
import { readJson } from '@/lib/validate';
import { logger } from '@/lib/log';

const log = logger('marketplace.purchase');

const bodySchema = z.object({
  projectId: z.coerce.number().int().positive(),
  tons: z.number().finite().positive().max(1_000_000),
});

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover" as any,
  });
  try {
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

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${projectData.name} - Carbon Offset`,
              description: `${tons} tons of CO2 offset`,
              images: projectData.imageUrl ? [projectData.imageUrl] : [],
            },
            unit_amount: Math.round(projectData.pricePerTon * 100),
          },
          quantity: Math.round(tons),
        },
      ],
      mode: "payment",
      success_url: `${process.env.BETTER_AUTH_URL}/app/marketplace/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.BETTER_AUTH_URL}/app/marketplace?canceled=true`,
      metadata: {
        userId: session.user.id,
        projectId: projectId.toString(),
        tons: tons.toString(),
        type: "carbon_offset",
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id
    });
  } catch (error) {
    const ref = log.error("Error creating purchase", error);
    return NextResponse.json(
      { error: "Failed to create purchase.", ref },
      { status: 500 }
    );
  }
}
