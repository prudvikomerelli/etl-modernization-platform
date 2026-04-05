# Databricks Workflows

## Overview
Databricks Lakeflow Jobs is Databricks workflow orchestration for data processing workloads. A job contains one or more tasks, supports DAG-style dependencies, parameters, schedules, notifications, and Git-backed source settings, and can be authored in the UI or via APIs and code/YAML representations. :contentReference[oaicite:4]{index=4}

## Core Concepts

### Job
Top-level workflow definition.

### Task
Unit of execution within a job.

### Dependency
Task-level DAG edges.

### Trigger / Schedule
Defines when the job runs.

### Parameter
Runtime values passed into tasks.

### Compute
Job cluster, existing cluster, or serverless execution depending on configuration.

## Best-Fit Mapping Rules

### Workflow
Maps to job.

### Session / Task
Maps to task.

### Transformation Logic
Maps to notebook task, pipeline task, Python wheel task, SQL task, or other supported task type.

### Parameters
Map to job parameters and task parameters.

### Dependencies
Map to task dependency lists.

## Practical Generation Rules
When generating Databricks artifacts:

- create one job per orchestration unit
- prefer task decomposition over one monolithic notebook
- pass parameters explicitly
- preserve dependency graph
- separate compute config from business logic as much as possible
- keep secrets out of generated config

## AI Guidance
The model should:

- generate job/task oriented output
- preserve graph structure
- select notebook or pipeline tasks only when appropriate
- avoid flattening multi-step ETL logic into a single task without justification

---