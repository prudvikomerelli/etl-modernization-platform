# SaaS Proposal: XML-to-JSON ETL Pipeline Conversion Platform (Legacy ETL XML → Canonical JSON → Cloud Pipeline JSON)

## 🎯 Objective
Build a production-style SaaS that helps data teams transform pipeline definitions exported as **XML** from legacy ETL tools into a **canonical JSON model** and then generate **target-platform JSON artifacts** compatible with modern cloud ETL/ELT and orchestration platforms. The platform will also provide **conversion validation**, highlight **unsupported transformations or gaps**, and store a **history of conversions** so teams can iterate quickly across multiple migration projects.

This product is designed to be:
- fast and practical for migration workflows (upload XML → parse → convert → export)
- extensible across multiple legacy ETL tools and cloud targets
- explainable and reviewable (canonical model + validation + warnings)
- subscription-ready (Stripe billing + plan gating)
- professional UI/UX (clean landing + app dashboard + project-based workflow)

---

## 🏗️ 1. Architecture Design

The architecture follows a modern SaaS pattern optimized for reliability, explainability, schema-based generation, and billing-based feature gating:

### A) Application Layer (Next.js)
- **Marketing site + Auth routes:**
  - `/` landing and marketing sections
  - `/login`, `/signup` authentication routes
- **Product application (protected):**
  - `/app/*` requires authentication
  - Core routes:
    - `/app` (dashboard/projects/history)
    - `/app/new` (new conversion project)
    - `/app/project/[id]` (project overview)
    - `/app/project/[id]/upload` (XML upload + source detection)
    - `/app/project/[id]/parse` (parsed metadata explorer)
    - `/app/project/[id]/convert` (target selection + conversion config)
    - `/app/result/[id]` (result viewer + warnings + export)
    - `/app/settings` (account + data controls)
    - `/app/billing` (plan + upgrade/manage billing)

### B) API Layer (Route Handlers / Server Actions)
- **Parsing + conversion:**
  - `POST /api/detect-source` → identifies ETL tool based on XML structure/signatures
  - `POST /api/parse` → extracts mappings, workflows, transformations, connectors, dependencies
  - `POST /api/normalize` → converts parsed XML into a canonical JSON contract
  - `POST /api/convert` → generates target-platform JSON from canonical JSON
  - `POST /api/validate` → validates generated JSON and surfaces warnings/errors
- **Exports:**
  - `POST /api/export/json` → returns canonical JSON or target JSON artifacts
  - `POST /api/export/package` → returns downloadable bundle for selected platform
- **Billing:**
  - `POST /api/stripe/checkout` → creates Checkout Session
  - `POST /api/stripe/portal` → creates Customer Portal Session
  - `POST /api/stripe/webhook` → webhook receiver (subscription sync + idempotency)

### C) Data Layer (PostgreSQL + Prisma)
- Persisted entities:
  - Users + billing linkage
  - Projects
  - Uploaded XML source files
  - Parsed artifacts
  - Canonical models
  - Conversion runs
  - Validation results
  - Subscription state
  - Usage counters
  - Webhook events (idempotency)

### D) Identity Layer (Supabase OAuth/Auth)
- Secure user identity + session handling
- Protected app access (`/app/*`)
- Ownership rules: users only access their own projects, uploads, conversions, and billing state

### E) Intelligence Layer (LLM Provider-Agnostic)
- Inputs: XML pipeline export + detected source metadata + options like target platform/version
- Outputs: **strict JSON** (canonical model, warnings, migration notes, target-specific generation aids)
- Guardrails:
  - XML is treated as untrusted user input
  - deterministic parsing remains the system of record
  - AI is used only where interpretation is needed
  - all output must conform to stable JSON contracts validated server-side before persistence/export

### F) Contracts & Source of Truth
- Parser versions, canonical schema versions, and target output schemas are versioned in the repo and treated as the single source of truth for:
  - UI rendering
  - validation display
  - export generation
  - migration notes
- Generated outputs must conform to stable JSON contracts validated server-side before persistence/export

### G) Design Inspiration Benchmark
- Build a high-performance SaaS inspired by:
  - metadata-driven migration tooling used in enterprise modernization programs
  - the reviewability and explainability of schema-first developer tooling
  - clean project workflows similar to modern SaaS dashboards used for developer platforms

---

## ✨ 2. Feature Design

### Core Features to Build:
1. **Landing + App UI (Next.js):**
   - Professional landing page that clearly communicates the value (legacy ETL XML to cloud pipeline JSON conversion).
   - App shell with real SaaS navigation:
     - Dashboard
     - Projects
     - New Conversion
     - Results
     - Settings
     - Billing
   - Clean empty states, loading states, and error states.

2. **XML Upload + Source Detection (Core Workflow):**
   - Accepts:
     - XML export file
     - Optional project name and notes
     - Options like target platform and conversion mode
   - Produces:
     - detected source ETL tool
     - parsed metadata summary
     - conversion-ready project workspace
   - Uploaded artifacts are saved to project history.

3. **Parsed Metadata Explorer:**
   - Shows extracted:
     - mappings
     - workflows
     - tasks
     - transformations
     - connectors
     - dependencies
     - parameters
   - Helps users inspect source logic before conversion.

4. **Canonical JSON Model Generation:**
   - Converts parsed XML into a stable, platform-neutral JSON contract.
   - This becomes the intermediate representation for all downstream conversions.
   - Canonical model is viewable in the UI and saved to history.

5. **Target Platform Conversion:**
   - Users can choose target outputs such as:
     - Azure Data Factory
     - Apache Airflow
     - Databricks Workflows
     - Dagster
     - Prefect
     - AWS Glue
   - Generates platform-specific JSON artifacts from the canonical model.

6. **Validation + Conversion Gap Analysis:**
   - Provides an explainable validation report driven by:
     - schema compliance
     - supported transformation coverage
     - unresolved dependencies
     - unsupported constructs
   - Shows:
     - successful mappings
     - missing/unsupported features
     - suggestions for manual remediation

7. **History + Versioning:**
   - Every project and conversion run is stored and viewable from the Dashboard.
   - Users can:
     - revisit results
     - compare multiple runs
     - regenerate with different target settings
     - delete a project or run

8. **Export / Download:**
   - Export:
     - canonical JSON
     - target-platform JSON
     - validation report
     - migration summary
   - Optional: downloadable packaged output structure for specific target tools.

9. **Authentication Feature:**
   - Use Supabase OAuth/Auth for user login/signup.
   - Protected routes across `/app/*`.

10. **Payments / Subscription Feature (Stripe):**
   - **Free tier**: limited projects, file size limits, limited conversions
   - **Pro tier**: more conversions, more target platforms, advanced validation
   - **Enterprise tier**: bulk conversion, team support, private deployment options
   - Components:
     - Upgrade button → Stripe Checkout
     - Manage Billing button → Stripe Customer Portal
     - Webhook handler updates plan state in DB

11. **Idempotency & Safety Guards:**
   - Webhook idempotency:
     - Store Stripe event IDs so subscription events are never applied twice.
   - Conversion idempotency:
     - If the same user submits the same XML + target within a short window, return the existing result when appropriate.
   - Output constraints:
     - Enforce schema validation before saving/exporting.
     - Prevent invalid target JSON from being persisted as successful output.

12. **Security Features:**
   - **Environment Secret Hygiene:**
     - All keys (Stripe, Supabase, LLM provider, storage credentials) are stored in environment files only.
     - No secret keys are exposed to the client bundle.
   - **Rate Limiting / Abuse Prevention:**
     - Limit upload/conversion requests per user per day, especially on free tier.
   - **Input Size Limits:**
     - Enforce maximum XML file size and parse depth to prevent abuse and unexpected costs.
   - **XML Parsing Safety:**
     - Protect against unsafe XML parsing patterns such as XXE and malformed payload abuse.
   - **Prompt Injection Guardrails:**
     - XML and metadata are treated as untrusted user content.
     - System rules override any embedded or inferred instructions from user input.
   - **Output Sanitization:**
     - Prevent malicious markup and scripts in rendered results.
     - Ensure exported artifacts match expected JSON schema constraints.

13. **Local Testing CLI:**
   - A developer script to quickly test the parsing/conversion pipeline without UI:
     - `scripts/parse-test.ts`
       - reads local XML file
       - calls the parse endpoint
       - prints extracted metadata
     - `scripts/convert-test.ts`
       - reads local XML or canonical JSON
       - calls the conversion endpoint
       - writes outputs to `/outputs`
   - Optional second script for Stripe webhook simulation in local dev:
     - `scripts/stripe-webhook-test.ts`

---

## 🗄️ 3. Database Design

The schema (managed via Prisma) is focused on:
- user identity
- project history and conversion outputs
- subscription state + usage tracking
- idempotency for Stripe webhooks

### `User` Table
Stores application users and billing linkage.
- `id` (UUID, Primary Key)
- `name` (String, nullable)
- `email` (String, Unique)
- `supabase_user_id` (String, Unique)
- `stripe_customer_id` (String, nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `Project` Table
Stores each migration/conversion project.
- `id` (UUID, Primary Key)
- `user_id` (FOREIGN KEY to `User`)
- `name` (String)
- `description` (Text, nullable)
- `source_tool` (String, nullable)
- `target_platform` (String, nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `SourceFile` Table
Stores uploaded XML source files and metadata.
- `id` (UUID, Primary Key)
- `project_id` (FOREIGN KEY to `Project`)
- `filename` (String)
- `storage_path` (String)
- `checksum` (String)
- `file_size_bytes` (BigInt)
- `createdAt` (DateTime)

### `ParsedArtifact` Table
Stores extracted structured metadata from source XML.
- `id` (UUID, Primary Key)
- `project_id` (FOREIGN KEY to `Project`)
- `source_file_id` (FOREIGN KEY to `SourceFile`)
- `parsed_json` (JSON)
- `detected_source_tool` (String, nullable)
- `warnings` (JSON)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `CanonicalModel` Table
Stores normalized platform-neutral pipeline JSON.
- `id` (UUID, Primary Key)
- `project_id` (FOREIGN KEY to `Project`)
- `parsed_artifact_id` (FOREIGN KEY to `ParsedArtifact`)
- `schema_version` (String)
- `canonical_json` (JSON)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `ConversionRun` Table
Stores each target conversion attempt and outputs.
- `id` (UUID, Primary Key)
- `project_id` (FOREIGN KEY to `Project`)
- `canonical_model_id` (FOREIGN KEY to `CanonicalModel`)
- `target_platform` (String)
- `target_version` (String, nullable)
- `output_json` (JSON)
- `validation_summary` (JSON)
- `warnings` (JSON)
- `status` (Enum: `SUCCESS`, `PARTIAL`, `FAILED`)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `Subscription` Table
Tracks plan state for gating features.
- `id` (UUID, Primary Key)
- `user_id` (FOREIGN KEY to `User`, Unique)
- `stripe_subscription_id` (String, nullable)
- `plan` (Enum: `FREE`, `PRO`, `ENTERPRISE`)
- `status` (Enum: `ACTIVE`, `PAST_DUE`, `CANCELED`)
- `current_period_end` (DateTime, nullable)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `Usage` Table
Tracks rate limits and plan enforcement.
- `id` (UUID, Primary Key)
- `user_id` (FOREIGN KEY to `User`)
- `date` (Date, indexed)
- `projects_count` (Int)
- `conversions_count` (Int)
- `exports_count` (Int)
- `storage_bytes_used` (BigInt)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### `WebhookEvent` Table (Idempotency)
Prevents double-processing of Stripe events.
- `id` (UUID, Primary Key)
- `stripe_event_id` (String, Unique)
- `type` (String)
- `receivedAt` (DateTime)

---

## 🎓 Learning Outcomes
By building this SaaS product end-to-end, builders will understand:
1. How to structure a real SaaS with clean routes, protected app pages, and production-style architecture.
2. How to design a reliable XML parsing and conversion pipeline that returns stable, structured outputs suitable for product UX.
3. How to build a canonical intermediate model that decouples source ETL systems from target cloud pipeline generators.
4. How to implement explainable validation and conversion-gap reporting for migration tooling.
5. How to model SaaS entities in a relational database (users, projects, source files, parsed artifacts, canonical models, conversions, subscriptions, usage).
6. How to integrate Stripe subscriptions with Checkout, Customer Portal, and secure webhook-driven state syncing.
7. How to apply security best practices: secret management, rate limiting, size limits, safe XML parsing, prompt-injection resistance, and output sanitization.
8. How to build developer tooling (local CLI scripts) to test parsing and conversion workflows without relying on the UI.