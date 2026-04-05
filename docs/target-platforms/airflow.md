# Apache Airflow

## Overview
Airflow organizes workflows as DAGs containing tasks. Tasks are the basic unit of execution, and operators are templates used to define tasks. The `@task` decorator is the modern recommended pattern for Python callables. DAGs express ordering, retries, scheduling, and dependencies. :contentReference[oaicite:3]{index=3}

## Core Concepts

### DAG
Directed acyclic graph that defines workflow structure.

### Task
Basic unit of execution.

### Operator
Template used to define a task.

### Sensor
Task type used for waiting on external conditions.

### TaskFlow API
Decorator-driven Python-native DAG authoring style.

### Dependency
Upstream/downstream relationship between tasks.

### Schedule
Run cadence defined at the DAG level.

### Params / Variables / Connections
Runtime and environment configuration concepts used by DAGs and tasks.

## Best-Fit Mapping Rules

### Workflow
Maps to DAG.

### Session / Task Instance
Maps to task.

### Transformation Node
Often maps to Python task, SQL task, or provider-specific operator.

### Dependency Edge
Maps to upstream/downstream dependency.

### Parameters
Map to DAG params, Variables, environment config, or task arguments depending on usage.

## Practical Generation Rules
When generating Airflow output:

- create one DAG per orchestration unit
- preserve task names in a Python-safe way
- prefer TaskFlow `@task` for Python-native generated DAGs
- use provider operators where a clear fit exists
- make dependencies explicit
- include retries and basic default args
- keep secrets out of code

## AI Guidance
The model should:

- generate readable Python DAGs
- preserve orchestration graph structure
- avoid converting everything into one PythonOperator unless necessary
- separate extract, transform, and load tasks where the source logic supports it

---