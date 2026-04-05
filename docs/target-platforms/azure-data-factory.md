# Azure Data Factory

## Overview
Azure Data Factory is a cloud data integration service centered on pipelines, activities, triggers, datasets, linked services, parameters, variables, and mapping data flows. Parameters can be defined on pipelines, datasets, linked services, and data flows; pipeline variables are mutable only within a pipeline run. Mapping data flows provide a transformation layer with script-backed metadata. :contentReference[oaicite:2]{index=2}

## Core Concepts

### Pipeline
Top-level orchestration object.

### Activity
Unit of work inside a pipeline.

Common activity categories include:

- copy/movement
- execute pipeline
- data flow
- notebook / compute integrations
- custom activity
- stored procedure
- variable/control-flow activities

### Dataset
Logical definition of data structure and location.

### Linked Service
Connection definition for a data store or compute target.

### Trigger
Defines when a pipeline runs.

### Parameter
Read-only runtime input for pipelines, datasets, linked services, or data flows.

### Variable
Mutable pipeline-scoped value.

### Mapping Data Flow
Transformation graph used for ELT/ETL logic.

## Best-Fit Mapping Rules

### Workflow / Job
Maps to pipeline.

### Session / Task
Maps to activity.

### Transformation Graph
Maps to mapping data flow when row-level transformations are needed.

### Simple Source-to-Target Movement
Maps to Copy activity.

### Reusable Connection Metadata
Maps to linked services and datasets.

### Parameters
Should be mapped to pipeline parameters first, then threaded into datasets/linked services/data flows as needed.

## Practical Generation Rules
When generating ADF artifacts:

- prefer Copy activity for straightforward movement
- use Mapping Data Flow for joins, derived columns, filters, aggregates, conditional routing, and multi-step row logic
- keep datasets separate from pipeline definitions
- keep linked services parameterized where possible
- use Key Vault for secrets, not inline secrets
- use pipeline parameters for external runtime control
- use variables only for mutable pipeline state

## JSON Generation Guidance
A high-quality generated ADF output should include:

- pipeline JSON
- referenced datasets
- referenced linked services
- optional mapping data flow JSON
- parameters with defaults where applicable
- dependsOn chains between activities

## AI Guidance
The model should:

- generate deployable, well-structured JSON
- separate pipeline, dataset, linked service, and dataflow concerns
- avoid stuffing all logic into one giant activity
- preserve orchestration order explicitly in `dependsOn`

---