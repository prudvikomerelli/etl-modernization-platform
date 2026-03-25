import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
      typescript: true,
    });
  }
  return _stripe;
}

export const PLANS = {
  FREE: {
    name: "Free",
    maxProjects: 3,
    maxConversionsPerDay: 5,
    maxFileSizeMB: 5,
    targetPlatforms: ["airflow"],
  },
  PRO: {
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    maxProjects: 25,
    maxConversionsPerDay: 50,
    maxFileSizeMB: 50,
    targetPlatforms: [
      "airflow",
      "azure-data-factory",
      "databricks",
      "dagster",
      "prefect",
      "aws-glue",
    ],
  },
  ENTERPRISE: {
    name: "Enterprise",
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    maxProjects: -1,
    maxConversionsPerDay: -1,
    maxFileSizeMB: 500,
    targetPlatforms: [
      "airflow",
      "azure-data-factory",
      "databricks",
      "dagster",
      "prefect",
      "aws-glue",
    ],
  },
} as const;
