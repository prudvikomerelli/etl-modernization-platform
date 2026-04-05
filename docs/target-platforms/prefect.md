# Prefect

## Overview
Prefect workflows are built from flows and tasks. Flows are Python functions decorated with `@flow`; tasks are atomic units of work decorated with `@task`. Deployments are the server-side representation used for remote orchestration, scheduling, and event-based runs. Work pools bridge deployments to execution infrastructure. :contentReference[oaicite:5]{index=5}

## Core Concepts

### Flow
Top-level workflow function.

### Task
Atomic, retryable, cacheable unit of work.

### Deployment
Remote orchestration wrapper for a flow.

### Work Pool
Execution/infrastructure routing layer.

### Work Queue
Priority and delivery control within a work pool.

### Parameter
Typed input passed to a flow.

## Best-Fit Mapping Rules

### Workflow
Maps to flow + deployment.

### Session / Task
Maps to task.

### Dependency Edge
Usually maps through dataflow or explicit orchestration in Python code.

### Schedule
Maps to deployment/schedule configuration.

### Parameters
Map to flow parameters and deployment defaults.

## Practical Generation Rules
When generating Prefect output:

- create a top-level flow
- break meaningful work into tasks
- use retries on tasks where appropriate
- keep infrastructure concerns in deployments/work pools, not embedded in task logic
- preserve orchestration order clearly in code

## AI Guidance
The model should:

- generate readable Python flow/task code
- separate flow logic from deployment metadata
- preserve data dependencies and control flow
- avoid giant single-function workflows when the source has meaningful task boundaries

---