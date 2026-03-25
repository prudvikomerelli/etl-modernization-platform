export type TargetPlatform =
  | "airflow"
  | "azure-data-factory"
  | "databricks"
  | "dagster"
  | "prefect"
  | "aws-glue";

export type SourceETLTool =
  | "informatica"
  | "talend"
  | "datastage"
  | "ssis"
  | "abinitio"
  | "unknown";

export interface DetectSourceResult {
  detectedTool: SourceETLTool;
  confidence: number;
  signatures: string[];
}

export interface ParsedMetadata {
  mappings: MappingInfo[];
  workflows: WorkflowInfo[];
  tasks: TaskInfo[];
  transformations: TransformationInfo[];
  connectors: ConnectorInfo[];
  dependencies: DependencyInfo[];
  parameters: ParameterInfo[];
}

export interface MappingInfo {
  name: string;
  source: string;
  target: string;
  fields: FieldMapping[];
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  dataType?: string;
}

export interface WorkflowInfo {
  name: string;
  tasks: string[];
  schedule?: string;
}

export interface TaskInfo {
  name: string;
  type: string;
  config: Record<string, unknown>;
}

export interface TransformationInfo {
  name: string;
  type: string;
  expression?: string;
  supported: boolean;
  notes?: string;
}

export interface ConnectorInfo {
  name: string;
  type: string;
  connectionString?: string;
  properties: Record<string, string>;
}

export interface DependencyInfo {
  source: string;
  target: string;
  type: string;
}

export interface ParameterInfo {
  name: string;
  value: string;
  type: string;
  scope: string;
}

export interface CanonicalPipeline {
  version: string;
  metadata: {
    name: string;
    description?: string;
    sourceTool: SourceETLTool;
    generatedAt: string;
  };
  sources: CanonicalSource[];
  sinks: CanonicalSink[];
  transformations: CanonicalTransformation[];
  orchestration: CanonicalOrchestration;
  parameters: ParameterInfo[];
}

export interface CanonicalSource {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  schema?: SchemaField[];
}

export interface CanonicalSink {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  schema?: SchemaField[];
}

export interface SchemaField {
  name: string;
  dataType: string;
  nullable?: boolean;
}

export interface CanonicalTransformation {
  id: string;
  name: string;
  type: string;
  inputs: string[];
  outputs: string[];
  logic: Record<string, unknown>;
}

export interface CanonicalOrchestration {
  tasks: OrchestrationTask[];
  dependencies: DependencyInfo[];
  schedule?: string;
}

export interface OrchestrationTask {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  coverage: {
    mappedTransformations: number;
    totalTransformations: number;
    percentage: number;
  };
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  path?: string;
  suggestion?: string;
}
