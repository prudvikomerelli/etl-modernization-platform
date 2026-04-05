# ETL Modernization Platform

A production-style SaaS that transforms legacy ETL pipeline definitions (XML) into cloud-native workflow artifacts (JSON) for modern orchestration platforms.

## 🎬 Demo

> **90-second product walkthrough** — see the full pipeline in action.

Place your demo video at `public/demo/etl-modernization-platform-demo.mp4` and thumbnail at `public/demo/etl-modernization-platform-thumbnail.png`.

<!-- Uncomment when video is available:
[![ETL Modernization Platform Demo](public/demo/etl-modernization-platform-thumbnail.png)](public/demo/etl-modernization-platform-demo.mp4)
-->

---

## Features

### Core Pipeline
- **XML Upload & Source Detection** — Auto-detect Informatica, Talend, DataStage, SSIS, Ab Initio
- **Parsed Metadata Explorer** — Inspect mappings, workflows, transformations, connectors, parameters
- **Canonical JSON Model** — Platform-neutral intermediate representation
- **Multi-Platform Conversion** — Generate artifacts for Airflow, Azure Data Factory, Databricks, Dagster, Prefect, AWS Glue
- **Validation & Gap Analysis** — Coverage scores, unsupported transform detection, remediation suggestions
- **Project History** — Store and revisit every conversion run
- **Export** — Download canonical JSON, target JSON, validation reports, or bundled packages

### New in v0.2
- **📊 Conversion Timeline** — Real-time step-by-step execution history for every project (upload → detect → parse → normalize → convert → validate → export)
- **📝 Structured Logging** — Centralized logging with `logger.ts` for APIs and pipeline steps
- **💾 Step-Level Persistence** — Every pipeline step is tracked in the database with status, duration, and error details via `ConversionStep` model
- **📚 Documentation Context Loader** — Source tool and target platform docs are automatically injected into AI prompts for better conversion quality
- **⚙️ Configurable AI Parameters** — Per-user model, temperature, top-p, and max token settings via Advanced AI Settings
- **🔗 Normalize Persistence** — Normalize route now optionally persists `CanonicalModel` and returns `canonicalModelId`
- **♻️ Convert with Existing Canonical** — Convert route accepts `canonicalModelId` to reuse existing canonical models

### Platform
- **Authentication** — Supabase OAuth/Auth with protected app routes
- **Billing** — Stripe subscriptions (Free / Pro / Enterprise) with webhook-driven state sync
- **Idempotency** — Webhook deduplication and conversion caching

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: Supabase
- **Payments**: Stripe
- **AI**: OpenAI (GPT-4o / GPT-3.5 Turbo)
- **Icons**: Lucide React

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your Supabase, Stripe, OpenAI, and DB credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/              # Login page
│   ├── (auth)/signup/             # Signup page
│   ├── app/                       # Protected app shell
│   │   ├── billing/               # Subscription management
│   │   ├── new/                   # New conversion project
│   │   ├── project/[id]/          # Project overview
│   │   │   ├── upload/            # XML upload + source detection
│   │   │   ├── parse/             # Parsed metadata explorer
│   │   │   ├── convert/           # Target conversion
│   │   │   └── components/        # NEW: Timeline UI components
│   │   │       ├── conversion-timeline.tsx
│   │   │       └── step-card.tsx
│   │   ├── result/[id]/           # Result viewer + validation
│   │   └── settings/              # Account settings + AI settings
│   │       ├── page.tsx
│   │       └── ai-settings.tsx    # NEW: AI parameter controls
│   ├── api/
│   │   ├── detect-source/         # ETL tool detection
│   │   ├── parse/                 # XML parsing (with step tracking)
│   │   ├── normalize/             # Canonical model generation (with persistence)
│   │   ├── convert/               # Target platform conversion (with step tracking)
│   │   ├── validate/              # Validation + gap analysis
│   │   ├── export/                # JSON + package export
│   │   ├── project-steps/         # NEW: Step history API
│   │   ├── user-llm-preferences/  # NEW: AI settings API
│   │   └── stripe/                # Checkout, portal, webhook
│   └── page.tsx                   # Landing page
├── components/
│   ├── layout/                    # Navbar, Sidebar, AppHeader, Footer
│   └── ui/                        # Button, Card, Badge, EmptyState
├── lib/
│   ├── prisma.ts                  # Prisma client
│   ├── auth.ts                    # Auth helpers
│   ├── llm-service.ts             # LLM calls (with config + docs support)
│   ├── logger.ts                  # NEW: Structured logging
│   ├── step-tracker.ts            # NEW: Step persistence helpers
│   ├── docs-loader.ts             # NEW: Documentation context loader
│   ├── prompt-context.ts          # NEW: Prompt enrichment with docs
│   ├── llm-config.ts              # NEW: User LLM preference management
│   ├── stripe.ts                  # Stripe helpers
│   └── utils.ts                   # General utilities
├── types/                         # TypeScript type definitions
└── middleware.ts                   # Route protection
docs/
├── source-tools/                  # Source ETL tool documentation
│   ├── informatica.md
│   ├── talend.md
│   ├── ssis.md
│   ├── datastage.md
│   └── abinitio.md
├── target-platforms/              # Target platform documentation
│   ├── azure-data-factory.md
│   ├── airflow.md
│   ├── databricks-workflows.md
│   ├── dagster.md
│   ├── prefect.md
│   └── aws-glue.md
├── mappings/                      # Migration mapping guides
│   ├── informatica-to-adf.md
│   └── informatica-to-airflow.md
└── project_upgrades.md            # Upgrade plan documentation
public/
└── demo/                          # Product demo assets
    └── README.md
scripts/
├── parse-test.ts                  # CLI: test parse pipeline
├── convert-test.ts                # CLI: test full conversion
└── stripe-webhook-test.ts         # CLI: simulate Stripe webhooks
```

---

## Database Models

### Core Models
| Model | Purpose |
|-------|---------|
| `User` | User accounts with Supabase + Stripe integration |
| `Project` | Conversion projects linked to users |
| `SourceFile` | Uploaded XML/ETL files |
| `ParsedArtifact` | Parsed metadata from source files |
| `CanonicalModel` | Platform-neutral canonical representation |
| `ConversionRun` | Target platform conversion outputs |

### New Models (v0.2)
| Model | Purpose |
|-------|---------|
| `ConversionStep` | Tracks each pipeline step (upload, detect, parse, normalize, convert, validate, export) with status, duration, and errors |
| `UserLlmPreference` | Per-user AI configuration (model, temperature, top-p, max tokens) |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/detect-source` | Identify source ETL tool from XML |
| POST | `/api/parse` | Extract metadata from XML (with step tracking) |
| POST | `/api/normalize` | Generate canonical JSON model (with optional persistence) |
| POST | `/api/convert` | Convert to target platform JSON (with step tracking) |
| POST | `/api/validate` | Validate conversion + gap analysis |
| POST | `/api/export/json` | Export JSON artifact |
| POST | `/api/export/package` | Export bundled package |
| GET | `/api/project-steps` | **NEW**: Fetch step history for a project |
| GET | `/api/user-llm-preferences` | **NEW**: Get user's AI settings |
| POST | `/api/user-llm-preferences` | **NEW**: Save user's AI settings |
| POST | `/api/stripe/checkout` | Create Stripe Checkout session |
| POST | `/api/stripe/portal` | Create Stripe Portal session |
| POST | `/api/stripe/webhook` | Handle Stripe webhook events |

---

## CLI Testing

```bash
# Test parsing
npx tsx scripts/parse-test.ts path/to/export.xml

# Test full conversion pipeline
npx tsx scripts/convert-test.ts path/to/export.xml airflow

# Stripe webhook testing
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  Upload → Parse → Normalize → Convert → Validate → Export       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Conversion Timeline (real-time)               │    │
│  └─────────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────────┤
│                        API Layer                                 │
│  Each route: Logger → Step Tracker → Business Logic → Response  │
├─────────────────────────────────────────────────────────────────┤
│                     AI / LLM Layer                               │
│  Prompt Context (docs-loader) → LLM Service (configurable)      │
├─────────────────────────────────────────────────────────────────┤
│                    Persistence Layer                              │
│  Prisma ORM → PostgreSQL                                         │
│  Models: User, Project, SourceFile, ParsedArtifact,             │
│          CanonicalModel, ConversionRun, ConversionStep,         │
│          UserLlmPreference, Subscription, Usage                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Supported Platforms

### Source ETL Tools
| Tool | Detection | Parsing | Documentation |
|------|-----------|---------|---------------|
| Informatica PowerCenter | ✅ | ✅ (XML + LLM) | ✅ |
| Talend | ✅ | ✅ (LLM) | ✅ |
| IBM DataStage | ✅ | ✅ (LLM) | ✅ |
| SSIS | ✅ | ✅ (LLM) | ✅ |
| Ab Initio | ✅ | ✅ (LLM) | ✅ |

### Target Platforms
| Platform | Conversion | Documentation |
|----------|------------|---------------|
| Apache Airflow | ✅ | ✅ |
| Azure Data Factory | ✅ | ✅ |
| Databricks Workflows | ✅ | ✅ |
| Dagster | ✅ | ✅ |
| Prefect | ✅ | ✅ |
| AWS Glue | ✅ | ✅ |

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# OpenAI
OPENAI_API_KEY=sk-...
# or
LLM_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## License

MIT
