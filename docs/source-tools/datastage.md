# IBM DataStage

## Overview
DataStage jobs typically model ETL as stages connected by links, with runtime orchestration around job execution, parameters, and sequencing. The most important concepts for conversion are jobs, stages, links, schemas, parameters, and job sequencing.

## Core Concepts

### Job
Primary execution unit.

### Stage
A processing or data movement component in a job.

### Link
Connection between stages, carrying row flow or control flow.

### Sequence Job
An orchestration-level job that coordinates execution order.

### Parameter
Runtime values passed to jobs or stages.

## What Matters for Parsing
Capture:

- job name
- stage names
- stage types
- input/output links
- schema definitions
- parameters
- sequence job order
- dataset/table/file sources and targets

## Migration Semantics
For migration:

- job maps to pipeline/workflow
- stage maps to node/activity/task
- links map to lineage edges
- sequence job maps to orchestration graph
- parameters map to runtime config

## AI Guidance
The model should:

- distinguish ETL job logic from sequencing/orchestration
- preserve stage type and stage order
- preserve link-level lineage
- keep parameter metadata available for downstream generation

---