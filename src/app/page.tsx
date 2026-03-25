import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileJson,
  Cloud,
  Shield,
  Zap,
  BarChart3,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Upload XML",
    description:
      "Drop your legacy ETL export files. We auto-detect Informatica, Talend, DataStage, SSIS, and more.",
  },
  {
    icon: FileJson,
    title: "Canonical Model",
    description:
      "XML is parsed into a platform-neutral JSON contract — your single source of truth for migration.",
  },
  {
    icon: Cloud,
    title: "Target Conversion",
    description:
      "Generate pipeline definitions for Airflow, Azure Data Factory, Databricks, Dagster, Prefect, or AWS Glue.",
  },
  {
    icon: Shield,
    title: "Validation & Gaps",
    description:
      "Get an explainable report of what mapped successfully, what's unsupported, and how to remediate.",
  },
  {
    icon: Zap,
    title: "Fast Iteration",
    description:
      "Store every conversion run. Compare results, tweak settings, and regenerate until it's right.",
  },
  {
    icon: BarChart3,
    title: "Migration Insights",
    description:
      "Track coverage scores, transformation mappings, and migration progress across projects.",
  },
];

const platforms = [
  { name: "Apache Airflow", color: "bg-teal-100 text-teal-800" },
  { name: "Azure Data Factory", color: "bg-blue-100 text-blue-800" },
  { name: "Databricks Workflows", color: "bg-red-100 text-red-800" },
  { name: "Dagster", color: "bg-purple-100 text-purple-800" },
  { name: "Prefect", color: "bg-indigo-100 text-indigo-800" },
  { name: "AWS Glue", color: "bg-orange-100 text-orange-800" },
];

const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 projects",
      "5 conversions/day",
      "5 MB file limit",
      "Airflow target only",
      "Basic validation",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    features: [
      "25 projects",
      "50 conversions/day",
      "50 MB file limit",
      "All 6 target platforms",
      "Advanced validation",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    features: [
      "Unlimited projects",
      "Unlimited conversions",
      "500 MB file limit",
      "All platforms",
      "Team support",
      "Private deployment",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="text-center">
            <div className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1.5 mb-6">
              <span className="text-sm font-medium text-blue-700">
                Legacy ETL → Cloud Pipelines
              </span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Modernize your ETL
              <br />
              <span className="text-blue-600">pipelines in minutes</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Upload XML exports from legacy ETL tools. Get validated,
              cloud-native pipeline definitions for Airflow, Azure Data Factory,
              Databricks, and more.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/signup" prefetch={false}>
                <Button size="lg">
                  Start Converting
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-blue-50 blur-3xl opacity-50" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Everything you need for ETL migration
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              A complete pipeline conversion workflow — from upload to export.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="inline-flex items-center justify-center rounded-lg bg-blue-50 p-3 mb-4">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Platforms */}
      <section id="platforms" className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Convert to any modern platform
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Generate pipeline definitions for the leading cloud ETL and
            orchestration platforms.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {platforms.map((platform) => (
              <span
                key={platform.name}
                className={`inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium ${platform.color}`}
              >
                {platform.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-8 ${
                  plan.highlighted
                    ? "border-blue-600 bg-white shadow-lg ring-1 ring-blue-600"
                    : "border-gray-200 bg-white shadow-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-medium text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="ml-1 text-gray-500">{plan.period}</span>
                </div>
                <ul className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/signup" prefetch={false}>
                    <Button
                      variant={plan.highlighted ? "primary" : "outline"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
