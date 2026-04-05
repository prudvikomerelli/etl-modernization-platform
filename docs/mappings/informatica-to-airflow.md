# Informatica to Apache Airflow

## Goal
Convert Informatica PowerCenter metadata into a readable, maintainable Airflow DAG that preserves orchestration and major ETL boundaries.

## High-Level Mapping

| Informatica | Apache Airflow |
|---|---|
| Workflow | DAG |
| Session | Task |
| Workflow Link | Task dependency |
| Mapping | Group of tasks or a transformation task |
| Source | Extract task |
| Transformation | Transform task |
| Target | Load task |
| Parameter / Variable | DAG params, Variables, env config, or task args |
| Schedule | DAG schedule |

## Preferred Strategy

### Orchestration-First
Airflow is best for orchestration.
Do not try to represent every row-level transformation as a separate Airflow primitive unless it makes operational sense.

### Recommended Task Pattern
A pragmatic generated DAG often follows:

- extract task(s)
- transform task(s)
- load task(s)
- optional validation or publish task(s)

### When to Use More Granularity
Break into more tasks when:

- sessions are operationally distinct
- retries need task-level isolation
- source workflows already have clean boundaries
- different compute/runtime environments are needed

## Dependency Rules
- preserve workflow sequencing explicitly
- convert workflow links into task dependencies
- preserve conditional logic where feasible
- do not invent parallelism unless supported by the source graph

## Parameter Rules
- externalized Informatica parameters should become DAG params or runtime config
- secrets should use Airflow Connections, Variables, or secret backends
- avoid hardcoding credentials or environment-specific paths

## Transformation Handling
Airflow itself is not a row transformation engine.
Use one of these patterns:

- Python task for light transformation
- SQL task/operator for SQL-driven transforms
- Spark/Databricks operator for large-scale transforms
- external job trigger for delegated execution

## Unsupported / Risky Areas
Flag for review if encountered:

- row-level semantics that require a dedicated transformation engine
- stateful update strategies
- complex reusable transformations
- proprietary Informatica behavior without direct Airflow equivalent

## Generation Checklist
A good generated Airflow output should include:

- a valid DAG definition
- readable task IDs
- explicit dependencies
- default args and retries
- schedule definition if known
- parameters/config placeholders
- migration notes for unsupported semantics

## AI Guidance
When converting Informatica to Airflow, the model should:

- treat Airflow as an orchestration target first
- preserve DAG structure faithfully
- choose clear task boundaries
- keep the DAG readable and production-oriented
- emit notes where actual row-processing should be delegated to Spark, SQL, dbt, or another engine