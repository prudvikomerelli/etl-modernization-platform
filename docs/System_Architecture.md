# System Architecture
## MappingXML2PipelineJSON

This document describes the system architecture for the MappingXML2PipelineJSON SaaS platform.

The platform converts **legacy ETL XML pipeline definitions** into **canonical JSON models** and then generates **pipeline configurations compatible with modern cloud orchestration platforms**.

The architecture focuses on:

- modular system design
- platform extensibility
- migration explainability
- scalable SaaS deployment
- secure pipeline processing

---

# Architecture Overview

The system follows a modular SaaS architecture composed of several services working together.

Core components include:

Frontend Application  
API Gateway  
XML Parsing Engine  
Canonical Model Generator  
Target Platform Converters  
Validation Engine  
Persistent Storage  
Authentication & Billing Services  

---

# High-Level Architecture Diagram

```
                +----------------------+
                |  Web Application     |
                |  Next.js UI          |
                +----------+-----------+
                           |
                           v
                 +---------+---------+
                 |      API Layer    |
                 | REST / GraphQL    |
                 +---------+---------+
                           |
        +------------------+------------------+
        |                  |                  |
        v                  v                  v
+---------------+  +---------------+  +---------------+
| XML Parsing   |  | Canonical     |  | Validation    |
| Engine        |  | Model Builder |  | Engine        |
+-------+-------+  +-------+-------+  +-------+-------+
        |                  |                  |
        v                  v                  v
           +----------------------------------+
           | Target Platform Adapters         |
           | ADF | Airflow | Dagster | Glue   |
           +----------------+-----------------+
                            |
                            v
                    Generated Pipeline JSON
```

---

# Component Architecture

## Frontend Application

The frontend application provides the user interface for managing pipeline conversion projects.

Responsibilities include:

- XML upload interface
- pipeline visualization
- conversion configuration
- migration report viewing
- export management

Technology stack:

- Next.js
- React
- TailwindCSS

---

## API Layer

The API layer orchestrates pipeline conversion workflows.

Example endpoints:

POST /api/upload  
POST /api/parse  
POST /api/normalize  
POST /api/convert  
POST /api/validate  
POST /api/export  

Responsibilities include:

- processing XML uploads
- detecting source ETL tools
- managing pipeline conversion workflows
- generating export artifacts

---

## XML Parsing Engine

The XML parsing engine extracts pipeline metadata from legacy ETL XML exports.

Parsed components include:

- sources
- transformations
- connectors
- targets
- workflow definitions
- dependencies
- parameters

Supported ETL systems may include:

- Informatica PowerCenter
- Talend
- SSIS
- Oracle Data Integrator
- IBM DataStage

---

## Canonical Pipeline Model

The canonical pipeline model is an intermediate representation of pipelines.

Benefits:

- decouples source parsing from target generation
- simplifies platform integrations
- enables validation and analytics
- improves testability

Pipeline structure:

```
Pipeline
  ├── Nodes
  │    ├── Source
  │    ├── Transformation
  │    └── Target
  └── Edges
       └── Dependencies
```

---

## Target Platform Adapters

Adapters translate canonical pipeline models into platform-specific configurations.

Supported adapters may include:

- Azure Data Factory
- Apache Airflow
- Dagster
- Databricks Workflows
- AWS Glue

Each adapter implements:

- node mapping
- dependency translation
- configuration generation

---

## Validation Engine

Before exporting pipelines, the system validates generated configurations.

Validation checks include:

- schema validation
- unsupported transformations
- dependency correctness
- circular references
- invalid parameters

Validation results include:

- errors
- warnings
- migration recommendations

---

## Data Storage

Persistent storage tracks projects and pipeline artifacts.

Database:

PostgreSQL

ORM:

Prisma

Stored entities include:

- users
- projects
- uploaded XML files
- parsed artifacts
- canonical models
- conversion runs
- validation results

---

## Authentication

Authentication is managed using Supabase Auth.

Capabilities include:

- OAuth login
- secure sessions
- protected application routes

---

## Billing

Stripe manages subscription plans.

Supported plans include:

Free  
Pro  
Enterprise  

Capabilities include:

- usage limits
- conversion quotas
- billing management

---

## Deployment Architecture

Typical deployment stack:

Frontend

Vercel

Backend APIs

Docker containers

Database

Managed PostgreSQL

Object Storage

Cloud object storage for XML artifacts

---

## Scalability Considerations

Key scalability strategies include:

- stateless API services
- worker queues for pipeline conversions
- horizontal scaling of parsing engines
- caching parsed metadata
- modular adapter architecture

---