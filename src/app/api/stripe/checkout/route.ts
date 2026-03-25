import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, customerId, returnUrl } = body;

    if (!plan || !["PRO", "ENTERPRISE"].includes(plan)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    const priceId = "priceId" in planConfig ? planConfig.priceId : undefined;

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 400 });
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId || undefined,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/app/billing?success=true`,
      cancel_url: `${returnUrl || process.env.NEXT_PUBLIC_APP_URL}/app/billing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
