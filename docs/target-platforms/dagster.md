# Dagster

## Overview
Dagster is an orchestration platform centered on software-defined assets, jobs, schedules, sensors, resources, and ops/graphs. For migration use cases, it is usually best modeled either as an asset graph or as a job composed of ops, depending on the source semantics.

## Core Concepts

### Asset
A durable data product or logical dataset in the platform.

### Op
A unit of computation.

### Graph
Composition of ops and dependencies.

### Job
Executable definition built from assets or graphs.

### Resource
External system or runtime dependency.

### Schedule / Sensor
Mechanisms for automated or event-driven execution.

## Best-Fit Mapping Rules

### Data-Centric Pipeline
Maps well to assets.

### Task-Centric Orchestration
Maps well to ops inside a graph/job.

### Source / Target
May map to assets, IO managers, or resources depending on design choice.

### Parameters
Map to config and resources.

## Practical Generation Rules
When generating Dagster artifacts:

- prefer assets when the pipeline is strongly dataset-oriented
- prefer ops/jobs when orchestration is task-oriented
- keep resources separate from asset/op logic
- preserve lineage as dependencies
- generate schedules separately from core asset/job definitions

## AI Guidance
The model should:

- choose asset-first design for data products
- choose ops/jobs when source logic is strongly procedural
- keep config explicit and typed where possible
- preserve lineage and orchestration semantics

---