# Ab Initio

## Overview
Ab Initio is typically modeled around graphs, components, flows, metadata, parameters, and runtime environments. For migration purposes, the important unit is the graph and the directed flow between components.

## Core Concepts

### Graph
Primary data processing topology.

### Component
A unit of processing, transformation, or data movement.

### Flow
The directed connection between components.

### Parameter
Runtime value controlling behavior.

### Metadata / Schema
Structure of input and output records.

## What Matters for Parsing
Capture:

- graph name
- component names
- component types
- flows between components
- input and output schemas
- parameters
- runtime/environment settings where relevant

## Migration Semantics
For migration:

- graph maps to pipeline/dataflow
- component maps to node/transformation/task
- flow maps to dependency or lineage edge
- parameter maps to runtime config
- metadata maps to canonical schema

## AI Guidance
The model should:

- preserve graph topology
- preserve component semantics
- keep field-level schema where possible
- avoid oversimplifying graphs into a single source-to-target copy

---