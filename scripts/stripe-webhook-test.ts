/**
 * Local testing script for Stripe webhook simulation.
 * Usage: npx tsx scripts/stripe-webhook-test.ts [event-type]
 */

async function main() {
  const eventType = process.argv[2] || "customer.subscription.updated";
  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  const mockEvent = {
    id: `evt_test_${Date.now()}`,
    type: eventType,
    data: {
      object: {
        id: "sub_test_123",
        customer: "cus_test_123",
        status: "active",
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        items: {
          data: [
            {
              price: {
                id: process.env.STRIPE_PRO_PRICE_ID || "price_test",
              },
            },
          ],
        },
      },
    },
  };

  console.log(`🧪 Simulating Stripe webhook: ${eventType}`);
  console.log("   Note: In production, webhooks require valid Stripe signatures.");
  console.log("   This script is for local development testing only.\n");
  console.log("Event payload:", JSON.stringify(mockEvent, null, 2));
  console.log("\n⚠️  To test with real signatures, use: stripe listen --forward-to localhost:3000/api/stripe/webhook");
}

main().catch(console.error);
