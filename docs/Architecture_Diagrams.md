# Architecture Diagrams
## MappingXML2PipelineJSON

This document contains visual diagrams explaining the architecture and data flow of the MappingXML2PipelineJSON platform.

The system converts **legacy ETL XML pipeline definitions** into **modern cloud pipeline configurations** using a canonical intermediate model.

---

# 1. End-to-End System Architecture

```
+---------------------+
|  Web Application    |
|  Next.js UI         |
+----------+----------+
           |
           v
+---------------------+
|  API Gateway        |
|  REST / GraphQL     |
+----------+----------+
           |
           v
+---------------------+
| XML Parsing Engine  |
+----------+----------+
           |
           v
+-----------------------------+
| Canonical Pipeline Model    |
| Platform-neutral structure  |
+----------+------------------+
           |
           v
+--------------------------------------+
| Target Platform Conversion Adapters  |
| ADF | Airflow | Dagster | Glue       |
+----------+---------------------------+
           |
           v
+----------------------------+
| Generated Pipeline JSON    |
+----------------------------+
```

---

# 2. Pipeline Conversion Flow

```
Legacy ETL XML
      |
      v
XML Parser
      |
      v
Parsed Pipeline Metadata
      |
      v
Canonical Pipeline Representation
      |
      v
Target Platform Generator
      |
      v
Modern Cloud Pipeline JSON
```

---

# 3. Component Architecture

```
+------------------------------------------------+
|                Frontend Layer                  |
|        Next.js / React / Tailwind UI           |
+----------------------+-------------------------+
                       |
                       v
+------------------------------------------------+
|                   API Layer                    |
|        Upload | Parse | Convert | Export       |
+----------------------+-------------------------+
                       |
                       v
+------------------------------------------------+
|              Conversion Engine                 |
|  XML Parser → Canonical Model → Target Adapters|
+----------------------+-------------------------+
                       |
                       v
+------------------------------------------------+
|                  Data Layer                    |
| PostgreSQL | Prisma | Artifact Storage        |
+------------------------------------------------+
```

---

# 4. Dependency Graph Generation

```
Source Table
     |
     v
Transformation
     |
     v
Aggregation
     |
     v
Target Table
```

The dependency graph helps determine:

- pipeline execution order
- task dependencies
- validation checks
- pipeline visualization

---

# 5. Deployment Architecture

```
Users
  |
  v
CDN / Edge Network
  |
  v
Frontend (Vercel)
  |
  v
API Services (Docker Containers)
  |
  v
Worker Nodes (Parsing + Conversion)
  |
  v
PostgreSQL Database
  |
  v
Object Storage (XML + JSON artifacts)
```