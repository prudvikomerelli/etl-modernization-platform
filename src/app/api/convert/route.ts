import { NextRequest, NextResponse } from "next/server";
import { CanonicalPipeline, TargetPlatform } from "@/types";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

function convertToAirflow(canonical: CanonicalPipeline & { _fieldMappings?: any[]; _mappingSummary?: any[] }) {
  const dagId = canonical.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  // Build tasks from orchestration
  const tasks = canonical.orchestration.tasks.map((task) => {
    const taskId = task.name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    return {
      task_id: taskId,
      operator: "PythonOperator",
      python_callable: `run_${taskId}`,
      doc: task.config?.mappingName
        ? `Executes mapping: ${task.config.mappingName}`
        : undefined,
    };
  });

  // Build source/sink extraction tasks
  const extractTasks = canonical.sources.map((src) => ({
    task_id: `extract_${src.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    operator: src.type === "xml" ? "PythonOperator" : "SqlToGcsOperator",
    source_name: src.name,
    source_type: src.type,
    schema: src.schema?.map((f) => ({ name: f.name, type: f.dataType })),
  }));

  const loadTasks = canonical.sinks.map((sink) => ({
    task_id: `load_${sink.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    operator: sink.type === "flat file" ? "PythonOperator" : "GcsToBigQueryOperator",
    target_name: sink.name,
    target_type: sink.type,
    schema: sink.schema?.map((f) => ({ name: f.name, type: f.dataType })),
  }));

  const transformTasks = canonical.transformations.map((tx) => ({
    task_id: `transform_${tx.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    operator: "PythonOperator",
    transformation_type: tx.type,
    inputs: tx.inputs,
    outputs: tx.outputs,
    logic: tx.logic,
  }));

  // Build dependency chain: extract >> transform >> load
  const dependencies: string[] = [];
  for (const ext of extractTasks) {
    for (const tr of transformTasks) {
      dependencies.push(`${ext.task_id} >> ${tr.task_id}`);
    }
  }
  for (const tr of transformTasks) {
    for (const ld of loadTasks) {
      dependencies.push(`${tr.task_id} >> ${ld.task_id}`);
    }
  }
  // Add orchestration dependencies
  for (const dep of canonical.orchestration.dependencies) {
    const src = dep.source.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    const tgt = dep.target.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    dependencies.push(`${src} >> ${tgt}`);
  }

  return {
    dag_id: dagId,
    description: canonical.metadata.description || "",
    schedule_interval: canonical.orchestration.schedule || null,
    default_args: {
      owner: "data_team",
      retries: 2,
      retry_delay_minutes: 5,
    },
    tasks: [...extractTasks, ...transformTasks, ...loadTasks, ...tasks],
    dependencies: [...new Set(dependencies)],
    parameters: canonical.parameters,
  };
}

function convertToADF(canonical: CanonicalPipeline & { _fieldMappings?: any[]; _mappingSummary?: any[] }) {
  // Build datasets from sources/sinks
  const datasets = [
    ...canonical.sources.map((src) => ({
      name: `ds_${src.name}`,
      type: src.type === "xml" ? "Xml" : "DelimitedText",
      linkedServiceName: `ls_${src.type}`,
      schema: src.schema?.map((f) => ({
        name: f.name,
        type: mapDataTypeToADF(f.dataType),
      })),
    })),
    ...canonical.sinks.map((sink) => ({
      name: `ds_${sink.name}`,
      type: sink.type === "flat file" ? "DelimitedText" : "AzureSqlTable",
      linkedServiceName: `ls_${sink.type}`,
      schema: sink.schema?.map((f) => ({
        name: f.name,
        type: mapDataTypeToADF(f.dataType),
      })),
    })),
  ];

  // Build copy activities with field mappings
  const mappingSummary = canonical._mappingSummary || [];
  const activities = mappingSummary.map((m: any) => ({
    name: m.name,
    type: "Copy",
    inputs: [{ referenceName: `ds_${m.source}`, type: "DatasetReference" }],
    outputs: [{ referenceName: `ds_${m.target}`, type: "DatasetReference" }],
    typeProperties: {
      source: {
        type: canonical.sources[0]?.type === "xml" ? "XmlSource" : "DelimitedTextSource",
      },
      sink: {
        type: canonical.sinks[0]?.type === "flat file" ? "DelimitedTextSink" : "AzureSqlSink",
      },
      translator: {
        type: "TabularTranslator",
        mappings: (m.fieldMappings || []).map((fm: any) => ({
          source: { name: fm.sourceField },
          sink: { name: fm.targetField },
        })),
      },
    },
  }));

  // Add expression transformation activities as DataFlow
  const dataFlows = canonical.transformations
    .filter((tx) => tx.type === "expression" && tx.logic)
    .map((tx) => ({
      name: `df_${tx.name}`,
      type: "MappingDataFlow",
      typeProperties: {
        sources: tx.inputs.map((inp) => ({ name: inp })),
        sinks: tx.outputs.map((out) => ({ name: out })),
        transformations: [{
          name: tx.name,
          description: `${tx.type} transformation`,
          expressions: tx.logic,
        }],
      },
    }));

  return {
    name: canonical.metadata.name,
    properties: {
      description: canonical.metadata.description || "",
      activities: activities.length > 0 ? activities : [{
        name: "CopyData",
        type: "Copy",
        inputs: canonical.sources.map((s) => ({ referenceName: `ds_${s.name}`, type: "DatasetReference" })),
        outputs: canonical.sinks.map((s) => ({ referenceName: `ds_${s.name}`, type: "DatasetReference" })),
        typeProperties: {},
      }],
      parameters: Object.fromEntries(
        canonical.parameters.map((p) => [p.name, { type: p.type, defaultValue: p.value }])
      ),
      annotations: [],
    },
    datasets,
    dataFlows,
  };
}

function convertToDatabricks(canonical: CanonicalPipeline & { _fieldMappings?: any[]; _mappingSummary?: any[] }) {
  const tasks = [];

  // Extract task
  for (const src of canonical.sources) {
    tasks.push({
      task_key: `extract_${src.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      notebook_task: {
        notebook_path: `/pipelines/extract_${src.name}`,
        base_parameters: {
          source_type: src.type,
          source_name: src.name,
          schema: JSON.stringify(src.schema || []),
        },
      },
    });
  }

  // Transform tasks
  for (const tx of canonical.transformations) {
    tasks.push({
      task_key: `transform_${tx.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      notebook_task: {
        notebook_path: `/pipelines/transform_${tx.name}`,
        base_parameters: {
          transformation_type: tx.type,
          logic: JSON.stringify(tx.logic),
        },
      },
      depends_on: canonical.sources.map((s) => ({
        task_key: `extract_${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      })),
    });
  }

  // Load task
  for (const sink of canonical.sinks) {
    tasks.push({
      task_key: `load_${sink.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      notebook_task: {
        notebook_path: `/pipelines/load_${sink.name}`,
        base_parameters: {
          target_type: sink.type,
          target_name: sink.name,
          schema: JSON.stringify(sink.schema || []),
        },
      },
      depends_on: canonical.transformations.map((tx) => ({
        task_key: `transform_${tx.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      })),
    });
  }

  return {
    name: canonical.metadata.name,
    description: canonical.metadata.description || "",
    tasks,
    schedule: canonical.orchestration.schedule
      ? { quartz_cron_expression: canonical.orchestration.schedule }
      : undefined,
    parameters: canonical.parameters,
  };
}

function convertToDagster(canonical: CanonicalPipeline) {
  const assets = [];

  // Source assets
  for (const src of canonical.sources) {
    assets.push({
      name: src.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      group_name: "sources",
      description: `Source: ${src.type} - ${src.name}`,
      metadata: { type: src.type, schema_fields: src.schema?.length || 0 },
      deps: [],
    });
  }

  // Transformation assets
  for (const tx of canonical.transformations) {
    assets.push({
      name: tx.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      group_name: "transformations",
      description: `${tx.type} transformation`,
      metadata: { type: tx.type, logic: tx.logic },
      deps: canonical.sources.map((s) => s.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")),
    });
  }

  // Sink assets
  for (const sink of canonical.sinks) {
    assets.push({
      name: sink.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
      group_name: "targets",
      description: `Target: ${sink.type} - ${sink.name}`,
      metadata: { type: sink.type, schema_fields: sink.schema?.length || 0 },
      deps: canonical.transformations.map((tx) =>
        tx.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")
      ),
    });
  }

  return {
    assets,
    schedules: canonical.orchestration.schedule
      ? [{ name: `${canonical.metadata.name}_schedule`, cron: canonical.orchestration.schedule }]
      : [],
    parameters: canonical.parameters,
  };
}

function convertToPrefect(canonical: CanonicalPipeline) {
  const tasks = [];

  for (const src of canonical.sources) {
    tasks.push({
      name: `extract_${src.name}`,
      fn: `extract_${src.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      task_type: "extract",
      config: { source_type: src.type, schema: src.schema },
    });
  }
  for (const tx of canonical.transformations) {
    tasks.push({
      name: `transform_${tx.name}`,
      fn: `transform_${tx.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      task_type: "transform",
      config: { type: tx.type, logic: tx.logic },
      upstream: canonical.sources.map((s) => `extract_${s.name}`),
    });
  }
  for (const sink of canonical.sinks) {
    tasks.push({
      name: `load_${sink.name}`,
      fn: `load_${sink.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      task_type: "load",
      config: { target_type: sink.type, schema: sink.schema },
      upstream: canonical.transformations.map((tx) => `transform_${tx.name}`),
    });
  }

  return {
    flow_name: canonical.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    description: canonical.metadata.description || "",
    tasks,
    schedule: canonical.orchestration.schedule
      ? { cron: canonical.orchestration.schedule }
      : null,
    parameters: canonical.parameters,
  };
}

function convertToGlue(canonical: CanonicalPipeline) {
  // Build Glue job with crawlers and ETL script
  const crawlers = canonical.sources.map((src) => ({
    Name: `crawler_${src.name}`,
    Role: "AWSGlueServiceRole",
    DatabaseName: canonical.metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    Targets: {
      S3Targets: [{ Path: `s3://data-lake/${src.name}/` }],
    },
    SchemaChangePolicy: { UpdateBehavior: "UPDATE_IN_DATABASE", DeleteBehavior: "LOG" },
  }));

  return {
    Name: canonical.metadata.name,
    Description: canonical.metadata.description || "",
    Role: "AWSGlueServiceRole",
    Command: {
      Name: "glueetl",
      ScriptLocation: `s3://glue-scripts/${canonical.metadata.name}.py`,
      PythonVersion: "3",
    },
    DefaultArguments: {
      ...Object.fromEntries(
        canonical.parameters.map((p) => [`--${p.name}`, p.value])
      ),
      "--job-language": "python",
      "--enable-continuous-cloudwatch-log": "true",
    },
    GlueVersion: "4.0",
    NumberOfWorkers: 2,
    WorkerType: "G.1X",
    Crawlers: crawlers,
    Transformations: canonical.transformations.map((tx) => ({
      name: tx.name,
      type: tx.type,
      inputs: tx.inputs,
      outputs: tx.outputs,
      logic: tx.logic,
    })),
    Targets: canonical.sinks.map((sink) => ({
      name: sink.name,
      type: sink.type,
      schema: sink.schema,
    })),
  };
}

function mapDataTypeToADF(dataType: string): string {
  const map: Record<string, string> = {
    string: "String",
    integer: "Int32",
    bigint: "Int64",
    number: "Decimal",
    byte: "Byte",
    short: "Int16",
    "small integer": "Int16",
    date: "DateTime",
    datetime: "DateTime",
  };
  return map[dataType?.toLowerCase()] || "String";
}

const converters: Record<TargetPlatform, (c: any) => unknown> = {
  airflow: convertToAirflow,
  "azure-data-factory": convertToADF,
  databricks: convertToDatabricks,
  dagster: convertToDagster,
  prefect: convertToPrefect,
  "aws-glue": convertToGlue,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canonical, targetPlatform, projectId, parsedArtifactId } = body;

    if (!canonical || !targetPlatform) {
      return NextResponse.json(
        { error: "canonical and targetPlatform are required" },
        { status: 400 }
      );
    }

    const useLLM = request.nextUrl.searchParams.get("llm") !== "false";
    let output;

    if (useLLM) {
      const { callLLM } = await import("@/lib/llm-service");
      const llmOutput = await callLLM("convert", "", { canonical, targetPlatform });
      output = llmOutput;
    } else {
      const converter = converters[targetPlatform as TargetPlatform];
      if (!converter) {
        return NextResponse.json(
          { error: `Unsupported target platform: ${targetPlatform}` },
          { status: 400 }
        );
      }
      output = converter(canonical);
    }

    // Persist canonical model and conversion run if projectId provided
    let canonicalModelId: string | null = null;
    let conversionRunId: string | null = null;

    if (projectId && parsedArtifactId) {
      try {
        await getOrCreateDbUser();

        const canonicalModel = await prisma.canonicalModel.create({
          data: {
            projectId,
            parsedArtifactId,
            schemaVersion: canonical.version || "1.0",
            canonicalJson: JSON.parse(JSON.stringify(canonical)),
          },
        });
        canonicalModelId = canonicalModel.id;

        const conversionRun = await prisma.conversionRun.create({
          data: {
            projectId,
            canonicalModelId: canonicalModel.id,
            targetPlatform,
            outputJson: JSON.parse(JSON.stringify(output)),
            validationSummary: {},
            status: "SUCCESS",
          },
        });
        conversionRunId = conversionRun.id;
      } catch (dbError) {
        console.error("DB persistence error (non-fatal):", dbError);
      }
    }

    return NextResponse.json({
      targetPlatform,
      output,
      canonicalModelId,
      conversionRunId,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Convert error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
