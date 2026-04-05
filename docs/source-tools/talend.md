# Talend

## Overview
Talend jobs are metadata-driven integration workflows composed of components connected into execution and data paths. Talend projects often model logic as jobs, subjobs, components, contexts, metadata connections, and routines.

## Common Concepts
Important Talend concepts include:

- project
- job
- subjob
- component
- context
- metadata connection
- schema
- routine
- trigger link
- row link

## What Matters for Parsing
When parsing Talend exports or metadata, capture:

- job name
- component list
- component type
- component configuration
- input and output schemas
- row links between components
- trigger links between components
- contexts and parameters
- reusable metadata connections

## Common Component Patterns
Typical Talend jobs use patterns such as:

- source input components
- transformation components
- lookup joins
- filters
- aggregations
- target output components
- orchestration triggers

## Migration Semantics
When converting Talend to a canonical model:

- job maps to pipeline/workflow
- component maps to node/activity/task
- row links map to data lineage edges
- trigger links map to orchestration dependencies
- contexts map to parameters
- metadata connections map to reusable connection metadata

## AI Guidance
The model should:

- distinguish row flow from trigger flow
- preserve component names and types
- capture contexts as parameters
- preserve schema shape at each major node
- retain subjob boundaries where they influence orchestration

---