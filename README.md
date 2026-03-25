# ETL Modernization Platform

A production-style SaaS that transforms legacy ETL pipeline definitions (XML) into cloud-native workflow artifacts (JSON) for modern orchestration platforms.

## Features

- **XML Upload & Source Detection** — Auto-detect Informatica, Talend, DataStage, SSIS, Ab Initio
- **Parsed Metadata Explorer** — Inspect mappings, workflows, transformations, connectors, parameters
- **Canonical JSON Model** — Platform-neutral intermediate representation
- **Multi-Platform Conversion** — Generate artifacts for Airflow, Azure Data Factory, Databricks, Dagster, Prefect, AWS Glue
- **Validation & Gap Analysis** — Coverage scores, unsupported transform detection, remediation suggestions
- **Project History** — Store and revisit every conversion run
- **Export** — Download canonical JSON, target JSON, validation reports, or bundled packages
- **Authentication** — Supabase OAuth/Auth with protected app routes
- **Billing** — Stripe subscriptions (Free / Pro / Enterprise) with webhook-driven state sync
- **Idempotency** — Webhook deduplication and conversion caching

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Supabase
- **Payments**: Stripe
- **Icons**: Lucide React

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase, Stripe, and DB credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (auth)/signup/         # Signup page
│   ├── app/                   # Protected app shell
│   │   ├── billing/           # Subscription management
│   │   ├── new/               # New conversion project
│   │   ├── project/[id]/      # Project overview
│   │   │   ├── upload/        # XML upload + source detection
│   │   │   ├── parse/         # Parsed metadata explorer
│   │   │   └── convert/       # Target conversion
│   │   ├── result/[id]/       # Result viewer + validation
│   │   └── settings/          # Account settings
│   ├── api/
│   │   ├── detect-source/     # ETL tool detection
│   │   ├── parse/             # XML parsing
│   │   ├── normalize/         # Canonical model generation
│   │   ├── convert/           # Target platform conversion
│   │   ├── validate/          # Validation + gap analysis
│   │   ├── export/            # JSON + package export
│   │   └── stripe/            # Checkout, portal, webhook
│   └── page.tsx               # Landing page
├── components/
│   ├── layout/                # Navbar, Sidebar, AppHeader, Footer
│   └── ui/                    # Button, Card, Badge, EmptyState
├── lib/                       # Prisma, Supabase, Stripe, auth, utils
├── types/                     # TypeScript type definitions
└── middleware.ts               # Route protection
scripts/
├── parse-test.ts              # CLI: test parse pipeline
├── convert-test.ts            # CLI: test full conversion
└── stripe-webhook-test.ts     # CLI: simulate Stripe webhooks
```

## CLI Testing

```bash
# Test parsing
npx tsx scripts/parse-test.ts path/to/export.xml

# Test full conversion pipeline
npx tsx scripts/convert-test.ts path/to/export.xml airflow

# Stripe webhook testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/detect-source` | Identify source ETL tool from XML |
| POST | `/api/parse` | Extract metadata from XML |
| POST | `/api/normalize` | Generate canonical JSON model |
| POST | `/api/convert` | Convert to target platform JSON |
| POST | `/api/validate` | Validate conversion + gap analysis |
| POST | `/api/export/json` | Export JSON artifact |
| POST | `/api/export/package` | Export bundled package |
| POST | `/api/stripe/checkout` | Create Stripe Checkout session |
| POST | `/api/stripe/portal` | Create Stripe Portal session |
| POST | `/api/stripe/webhook` | Handle Stripe webhook events |
