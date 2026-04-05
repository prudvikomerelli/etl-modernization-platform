# AWS Glue

## Overview
AWS Glue supports ETL jobs, crawlers, triggers, and workflows. Triggers can start jobs and crawlers on demand, on a schedule, or conditionally; workflows provide a graph view and orchestration layer over jobs, crawlers, and triggers. Workflows and triggers are the key orchestration concepts for migration. :contentReference[oaicite:6]{index=6}

## Core Concepts

### Job
Primary ETL execution unit.

### Crawler
Schema/catalog discovery unit.

### Trigger
On-demand, scheduled, conditional, or event-based starter.

### Workflow
Graph of jobs, crawlers, and triggers.

### Job Arguments
Runtime parameters for jobs.

## Best-Fit Mapping Rules

### Workflow
Maps to Glue workflow.

### Task / Session
Usually maps to job.

### Dependency Edge
Maps to trigger-based job dependencies inside a workflow.

### Parameters
Map to job arguments.

### Source Metadata Discovery
May map to crawlers where appropriate.

## Practical Generation Rules
When generating Glue artifacts:

- create jobs for executable ETL steps
- create triggers for dependencies and schedules
- use workflows for multi-step orchestration
- do not pass plaintext secrets in job arguments
- keep script location and runtime config explicit

## AI Guidance
The model should:

- model orchestration through workflows and triggers
- preserve dependencies explicitly
- use job arguments for runtime parameters
- generate crawler usage only when metadata discovery is actually needed

---