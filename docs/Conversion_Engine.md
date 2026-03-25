# Conversion Engine
## XML → Canonical JSON → Target Platform Pipelines

The Conversion Engine is the core component of the MappingXML2PipelineJSON platform.

It converts **XML pipeline definitions from legacy ETL systems** into **modern pipeline configurations** through a multi-stage transformation pipeline.

---

# Conversion Pipeline Overview

```
Legacy ETL XML
      |
      v
XML Parser
      |
      v
Parsed Metadata
      |
      v
Canonical Pipeline Model
      |
      v
Target Platform Adapter
      |
      v
Platform Pipeline JSON
```

---

# Stage 1: XML Parsing

The XML parser extracts pipeline metadata from legacy ETL exports.

Extracted components include:

- source tables
- transformations
- joins
- aggregations
- connectors
- workflow dependencies
- parameters

Example transformation XML:

```
<TRANSFORMATION NAME="Aggregator" TYPE="AGGREGATOR">
  <TRANSFORMFIELD NAME="TOTAL_SALES"/>
</TRANSFORMATION>
```

Parsed metadata representation:

```
{
  type: "transformation",
  transformType: "aggregator",
  name: "TOTAL_SALES"
}
```

---

# Stage 2: Canonical Pipeline Model

Parsed metadata is normalized into a platform-neutral canonical pipeline representation.

Example canonical pipeline:

```
{
  pipeline_name: "sales_pipeline",
  nodes: [
    { id: "src_sales", type: "source" },
    { id: "agg_sales", type: "aggregation" },
    { id: "tgt_sales_dw", type: "target" }
  ],
  edges: [
    { from: "src_sales", to: "agg_sales" },
    { from: "agg_sales", to: "tgt_sales_dw" }
  ]
}
```

Canonical model benefits include:

- unified transformation structure
- reusable pipeline definitions
- simplified conversion logic
- platform-independent validation

---

# Stage 3: Target Platform Conversion

The canonical model is converted into platform-specific pipeline configurations.

Supported platforms include:

Azure Data Factory  
Apache Airflow  
Dagster  
Databricks Workflows  
AWS Glue  

---

## Example: Airflow Conversion

Canonical node:

```
{ id: "src_sales", type: "source" }
```

Generated Airflow component:

```
src_sales = PythonOperator(
    task_id="src_sales",
    python_callable=extract_sales_data
)
```

Dependencies are translated into DAG edges.

---

## Example: Azure Data Factory Conversion

Canonical node:

```
{ id: "agg_sales", type: "aggregation" }
```

Generated ADF pipeline JSON:

```
{
  "name": "AggregateSales",
  "type": "DataFlow",
  "dependsOn": ["ExtractSales"]
}
```

---

# Transformation Mapping

Example mapping between legacy ETL transformations and canonical model.

| Legacy Transformation | Canonical Model | Target Platform |
|----------------------|----------------|----------------|
| Source Qualifier | Source Node | Dataset |
| Expression | Derived Column | Transform |
| Joiner | Join | Join Activity |
| Aggregator | Aggregate | Aggregate Transform |
| Router | Conditional Branch | Conditional Activity |

---

# Dependency Graph Generation

The engine builds a directed graph representing pipeline flow.

Example graph:

```
Source → Transformation → Aggregation → Target
```

This graph is used for:

- dependency generation
- execution ordering
- cycle detection
- visualization

---

# Validation Engine

After conversion, validation ensures pipelines are correct.

Validation includes:

Schema validation  
Dependency validation  
Transformation compatibility checks  

Example validation report:

```
Converted Transformations: 12
Unsupported Transformations: 2
Warnings: 3
Errors: 0
```

---

# Performance Considerations

Conversion performance is improved through:

- streaming XML parsing
- incremental canonical model generation
- parallel conversion adapters
- schema caching

---

# Extensibility

The engine is designed to support plugin adapters.

New source adapters can support additional ETL tools.

New target adapters can support additional orchestration platforms.

---

# Summary

The conversion engine separates pipeline transformation into three stages:

1. XML parsing  
2. canonical pipeline modeling  
3. target platform generation  

This architecture enables scalable ETL modernization across multiple legacy systems and modern cloud orchestration platforms.