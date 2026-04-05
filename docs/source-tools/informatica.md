# Informatica PowerCenter

## Overview
Informatica PowerCenter is a metadata-driven ETL platform that models data integration through repositories, folders, sources, targets, mappings, sessions, workflows, connectors, and transformations.

For XML export and reverse engineering, the most important concepts are:

- repository
- folder
- source
- target
- mapping
- transformation
- connector
- session
- workflow
- task instance

## Common XML Signatures
Typical Informatica PowerCenter exports include tags such as:

- `POWERMART`
- `REPOSITORY`
- `FOLDER`
- `SOURCE`
- `TARGET`
- `MAPPING`
- `TRANSFORMATION`
- `CONNECTOR`
- `SESSION`
- `WORKFLOW`
- `TASKINSTANCE`

These are strong indicators that the source system is Informatica PowerCenter.

## Core Object Model

### Repository
Top-level metadata container.

### Folder
Logical grouping of mappings, workflows, reusable transformations, sources, and targets.

### Source
Represents an input structure, usually a table, file, XML source, or external dataset.

### Target
Represents the output structure that receives transformed data.

### Mapping
Defines the logical dataflow from sources through transformations to targets.

### Transformation
Represents an operation within a mapping.

### Connector
Represents field-level lineage between instances and fields.

### Session
Represents execution configuration for a mapping.

### Workflow
Represents orchestration logic and execution order across sessions and tasks.

## Common Transformation Types
Frequently encountered transformation types include:

- Source Qualifier
- Expression
- Aggregator
- Joiner
- Router
- Lookup
- Filter
- Sorter
- Union
- Sequence Generator
- Update Strategy
- XML Parser / XML Generator
- Stored Procedure
- Java Transformation

## What Matters for Parsing
When extracting metadata, capture:

- source names and field definitions
- target names and field definitions
- transformation type and name
- transformation fields and port types
- field expressions
- connectors between instances
- workflow task order
- session-to-mapping relationship
- parameters and variables if present

## Important Semantics

### Mapping vs Workflow
A mapping defines the logical transformation graph.
A workflow defines orchestration and runtime execution.

### Session
A session is usually the runtime wrapper around a mapping.

### Connectors
Connectors are critical for lineage. They define field movement from one instance and field to another instance and field.

### Port Types
Transformation fields often carry input/output semantics through port types. Preserve them when possible.

## Migration Notes
For migration into modern orchestration platforms:

- workflows often map to pipelines, jobs, or DAGs
- sessions often map to tasks or activities
- mappings often map to dataflow graphs
- connectors map to lineage edges
- expressions should be preserved as closely as possible
- unsupported transformations should be described, not discarded

## AI Extraction Guidance
When using this document as prompt context, the model should:

- prefer exact transformation names from XML
- preserve field lineage
- preserve expression text where available
- separate orchestration from transformation logic
- avoid collapsing sessions, mappings, and workflows into a single layer

---