# projects_upgrades.md
## ETL Modernization Platform — Upgrade Plan
### Safe, Incremental Enhancements That Preserve Existing Functionality

This document describes a safe implementation plan for upgrading the `etl-modernization-platform` repository without breaking the current application flow.

The main goals are:

- add source and target documentation so AI has better context
- add structured logs
- store each step of conversion in the database
- persist step history in the UI
- add configurable AI parameters like temperature
- add a 90-second product demo video
- preserve all existing code paths so current functionality keeps working

This plan is intentionally incremental and backward-compatible.

---

# 1. Upgrade Goals

The project already has working APIs for:

- parsing ETL XML
- normalizing parsed metadata
- converting canonical JSON into target platform outputs
- persisting some artifacts in the database

The upgrades in this document improve:

- AI output quality
- observability
- traceability
- product UX
- business storytelling

The implementation must preserve the current project flow and avoid breaking existing routes, data models, and UI pages.

---

# 2. Current State Summary

The current project already includes:

- `parse` route with XML parsing and DB persistence for `SourceFile` and `ParsedArtifact`
- `normalize` route that returns canonical JSON but does not persist it
- `convert` route that generates target outputs and persists `CanonicalModel` and `ConversionRun`
- centralized LLM calls in `src/lib/llm-service.ts`
- Prisma models for users, projects, source files, parsed artifacts, canonical models, conversion runs, subscriptions, and usage

The biggest gaps today are:

- no persistent step-by-step execution history
- no structured logging framework
- no documentation context loader for source and target tools
- no user-configurable AI parameters
- no business-impact demo asset

---

# 3. Guiding Principles

All changes must follow these principles:

1. Keep existing routes and payloads working.
2. Do not remove or rename current database tables unless absolutely necessary.
3. Add new models and helpers in a backward-compatible way.
4. Keep current UI screens working even if new data is unavailable.
5. Introduce new features behind optional logic wherever possible.
6. Preserve current `parse -> normalize -> convert` behavior.
7. Add observability and persistence incrementally.

---

# 4. Upgrade Overview

The recommended upgrades are:

## A. Documentation Context for AI
Add structured source-tool and target-platform docs that can be injected into prompts.

## B. Structured Logging
Add centralized logging helpers for APIs and conversion steps.

## C. Step-Level Persistence
Store every major step of conversion in the database.

## D. UI Timeline / Step History
Expose persisted conversion steps in the UI.

## E. Configurable AI Parameters
Allow model, temperature, and related settings to be configured safely.

## F. Product Demo Video
Add a 90-second demo video to the app and repo.

---

# 5. Recommended Implementation Order

Implement changes in this order:

1. Add database model for conversion steps
2. Add step persistence helper
3. Add structured logging helper
4. Persist normalize step
5. Persist validate/export steps
6. Add UI timeline panel
7. Add documentation context loader
8. Add AI parameter settings
9. Add video assets and embed in app + README

This order minimizes risk and keeps the app deployable after each phase.

---

# 6. File and Folder Additions

Add the following files and folders.

```text
docs/
  source-tools/
    informatica.md
    talend.md
    ssis.md
    datastage.md
    abinitio.md
  target-platforms/
    azure-data-factory.md
    airflow.md
    databricks-workflows.md
    dagster.md
    prefect.md
    aws-glue.md
  mappings/
    informatica-to-adf.md
    informatica-to-airflow.md

public/
  demo/
    etl-modernization-platform-demo.mp4
    etl-modernization-platform-thumbnail.png

src/
  lib/
    logger.ts
    step-tracker.ts
    docs-loader.ts
    prompt-context.ts
    llm-config.ts
  app/
    api/
      project-steps/
        route.ts
    app/
      project/
        [id]/
          components/
            conversion-timeline.tsx
            step-card.tsx

Upgrade the existing etl-modernization-platform repository without breaking current functionality.

Requirements:
1. Keep existing routes and response shapes working.
2. Add a new Prisma model called ConversionStep to persist each pipeline step: upload, detect, parse, normalize, convert, validate, export.
3. Add a new Prisma model called UserLlmPreference for model + temperature + topP + max tokens.
4. Add src/lib/logger.ts for structured logs.
5. Add src/lib/step-tracker.ts with startStep, completeStep, and failStep helpers.
6. Add docs/source-tools and docs/target-platforms loaders so LLM prompts can use tool-specific and platform-specific documentation.
7. Update src/lib/llm-service.ts to accept optional config like model and temperature, while preserving current default behavior.
8. Update parse, normalize, and convert routes to log and persist steps safely.
9. Update normalize so it can optionally persist CanonicalModel and return canonicalModelId, but do not require this for existing callers.
10. Update convert so it can accept canonicalModelId, but preserve existing canonical payload fallback.
11. Add a project-steps API route and UI timeline components to render step history safely.
12. Add an Advanced AI Settings section in settings UI.
13. Add support for a 90-second demo video in public/demo and wire it into README or landing page.

Constraints:
- Do not remove or rename existing tables or routes.
- Do not break current parse/normalize/convert flows.
- All new features must be backward-compatible and additive.
- Step persistence and logging failures should be non-fatal wherever possible.