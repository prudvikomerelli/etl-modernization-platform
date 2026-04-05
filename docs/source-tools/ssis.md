# SQL Server Integration Services (SSIS)

## Overview
SSIS packages consist of a control flow and, optionally, one or more data flows. Control flow uses tasks, containers, and precedence constraints to define execution order. Data flow handles row-based ETL operations. This structure is central to any SSIS-to-canonical conversion. :contentReference[oaicite:1]{index=1}

## Core Concepts

### Package
The main deployable and executable unit.

### Control Flow
Defines execution order using:

- tasks
- containers
- precedence constraints

### Data Flow
Defines row movement and row-level transformations.

### Task
Represents a unit of work in control flow.

### Container
Provides grouping and nesting for tasks.

### Precedence Constraint
Defines sequencing and conditional execution between tasks.

### Parameter / Variable
Provides runtime values and state used during execution.

## Common SSIS Artifacts to Extract
When parsing SSIS metadata, capture:

- package name
- control flow tasks
- data flow tasks
- precedence constraints
- source components
- transformation components
- destination components
- variables
- parameters
- connection managers

## Migration Semantics
For migration:

- package maps to pipeline or job
- control flow maps to orchestration graph
- data flow maps to transformation graph
- precedence constraints map to dependencies
- variables and parameters map to runtime config
- connection managers map to linked services or connection objects

## AI Guidance
The model should:

- keep control flow distinct from data flow
- preserve dependency conditions
- capture data flow components as canonical transformation nodes
- map package-level config to pipeline-level config
- not flatten the whole package into a single copy step unless the source is truly simple

---