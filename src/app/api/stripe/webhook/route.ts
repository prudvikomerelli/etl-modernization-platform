import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency check
  const existing = await prisma.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Store event for idempotency
  await prisma.webhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
    },
  });

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          const plan = determinePlan(subscription);
          await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              stripeSubscriptionId: subscription.id,
              plan,
              status: mapStatus(subscription.status),
              currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
            },
            create: {
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              plan,
              status: mapStatus(subscription.status),
              currentPeriodEnd: new Date((subscription as unknown as { current_period_end: number }).current_period_end * 1000),
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.subscription.update({
            where: { userId: user.id },
            data: {
              plan: "FREE",
              status: "CANCELED",
              stripeSubscriptionId: null,
            },
          });
        }
        break;
      }
    }
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

function determinePlan(subscription: Stripe.Subscription): "FREE" | "PRO" | "ENTERPRISE" {
  const priceId = subscription.items.data[0]?.price?.id;
  if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) return "ENTERPRISE";
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "PRO";
  return "FREE";
}

function mapStatus(status: Stripe.Subscription.Status): "ACTIVE" | "PAST_DUE" | "CANCELED" {
  switch (status) {
    case "active":
    case "trialing":
      return "ACTIVE";
    case "past_due":
      return "PAST_DUE";
    default:
      return "CANCELED";
  }
}
