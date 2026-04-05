# Informatica to Azure Data Factory

## Goal
Convert Informatica PowerCenter metadata into Azure Data Factory artifacts in a way that preserves:

- orchestration
- transformation intent
- lineage
- parameters
- deployability

## High-Level Mapping

| Informatica | Azure Data Factory |
|---|---|
| Workflow | Pipeline |
| Session | Activity or Execute Pipeline |
| Mapping | Mapping Data Flow or grouped pipeline logic |
| Source | Dataset + source in Copy/Data Flow |
| Target | Dataset + sink in Copy/Data Flow |
| Connector | Lineage/dependency inside Data Flow or mapping metadata |
| Parameter / Variable | Pipeline parameter, data flow parameter, linked service parameter, or variable |
| Expression | Derived column or expression logic in Mapping Data Flow |
| Joiner | Join transformation in Mapping Data Flow |
| Aggregator | Aggregate transformation in Mapping Data Flow |
| Filter | Filter transformation or conditional logic |
| Lookup | Lookup transformation or enrichment pattern |
| Router | Conditional split / branch logic |

## Preferred Strategy

### Simple Pipelines
If the Informatica mapping is mostly source-to-target movement with minor mapping:
- use Copy activity
- use explicit translator mappings if needed

### Complex Row-Level Transformations
If the mapping contains joins, expressions, filters, aggregates, or routing:
- create a Mapping Data Flow
- keep orchestration in the pipeline
- keep transformation logic in the data flow

## Orchestration Rules
- one Informatica workflow usually maps to one ADF pipeline
- one Informatica session may map to one ADF activity, execute-pipeline activity, or a pipeline+dataflow pair
- workflow links should map to `dependsOn`

## Parameter Rules
- external runtime values should become pipeline parameters
- reusable connection/path values should become dataset or linked service parameters
- mutable state should use pipeline variables only when truly necessary

## Expression Handling
When converting Informatica expressions:
- preserve the expression text where possible
- normalize field references
- convert into ADF expression or Mapping Data Flow expression syntax
- if exact conversion is uncertain, emit a migration note and preserve original source expression in metadata

## Unsupported / Risky Areas
Flag for review if encountered:

- Update Strategy semantics
- Sequence Generator behavior
- Java transformations
- Stored procedure side effects
- XML-specific advanced parsing logic
- complex reusable transformations with hidden dependencies

## Generation Checklist
A complete generated output may include:

- pipeline JSON
- dataset JSON files
- linked service references
- mapping data flow JSON
- parameter definitions
- validation notes

## AI Guidance
When converting Informatica to ADF, the model should:

- separate orchestration from transformation logic
- prefer native ADF constructs
- keep output modular
- preserve lineage
- emit warnings rather than silently dropping unsupported behavior

---