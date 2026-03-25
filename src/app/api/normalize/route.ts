import { NextRequest, NextResponse } from "next/server";
import { CanonicalPipeline } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parsedData, sourceTool, projectName } = body;

    if (!parsedData) {
      return NextResponse.json({ error: "No parsed data provided" }, { status: 400 });
    }

    const useLLM = request.nextUrl.searchParams.get("llm") !== "false";
    if (useLLM) {
      const { callLLM } = await import("@/lib/llm-service");
      const canonical = await callLLM("normalize", "", { parsedData });
      return NextResponse.json(canonical);
    }

    // Build sources from parsed SOURCE definitions
    const sources = (parsedData.sources || []).map(
      (src: {
        name: string;
        databaseType: string;
        dbdName: string;
        fields: Array<{ name: string; dataType: string; nullable: boolean }>;
      }, i: number) => ({
        id: `src-${i + 1}`,
        name: src.name,
        type: src.databaseType?.toLowerCase() || "unknown",
        config: {
          dbdName: src.dbdName || "",
          databaseType: src.databaseType || "",
        },
        schema: (src.fields || []).map(
          (f: { name: string; dataType: string; nullable: boolean }) => ({
            name: f.name,
            dataType: f.dataType,
            nullable: f.nullable,
          })
        ),
      })
    );

    // Build sinks from parsed TARGET definitions
    const sinks = (parsedData.targets || []).map(
      (tgt: {
        name: string;
        databaseType: string;
        fields: Array<{ name: string; dataType: string; nullable: boolean }>;
      }, i: number) => ({
        id: `tgt-${i + 1}`,
        name: tgt.name,
        type: tgt.databaseType?.toLowerCase() || "unknown",
        config: {
          databaseType: tgt.databaseType || "",
        },
        schema: (tgt.fields || []).map(
          (f: { name: string; dataType: string; nullable: boolean }) => ({
            name: f.name,
            dataType: f.dataType,
            nullable: f.nullable,
          })
        ),
      })
    );

    // Build transformations from parsed TRANSFORMATION definitions
    const transformations = (parsedData.transformations || []).map(
      (tx: {
        name: string;
        type: string;
        fields: Array<{
          name: string;
          dataType: string;
          expression: string;
          portType: string;
        }>;
      }, i: number) => {
        const inputs = (tx.fields || [])
          .filter((f) => f.portType?.includes("INPUT"))
          .map((f) => f.name);
        const outputs = (tx.fields || [])
          .filter((f) => f.portType?.includes("OUTPUT"))
          .map((f) => f.name);

        // Build expression logic map
        const expressionMap: Record<string, string> = {};
        for (const f of tx.fields || []) {
          if (f.expression && f.expression !== f.name) {
            expressionMap[f.name] = f.expression;
          }
        }

        return {
          id: `tx-${i + 1}`,
          name: tx.name,
          type: tx.type?.toLowerCase() || "unknown",
          inputs,
          outputs,
          logic: {
            expressions: Object.keys(expressionMap).length > 0 ? expressionMap : undefined,
            fields: (tx.fields || []).map((f) => ({
              name: f.name,
              dataType: f.dataType,
              expression: f.expression,
              portType: f.portType,
            })),
          },
        };
      }
    );

    // Build field mapping info from connectors
    const fieldMappings = (parsedData.connectors || []).map(
      (c: {
        fromField: string;
        fromInstance: string;
        fromInstanceType: string;
        toField: string;
        toInstance: string;
        toInstanceType: string;
      }) => ({
        source: `${c.fromInstance}.${c.fromField}`,
        target: `${c.toInstance}.${c.toField}`,
        fromInstanceType: c.fromInstanceType,
        toInstanceType: c.toInstanceType,
      })
    );

    // Build orchestration from workflows
    const allTasks: Array<{ id: string; name: string; type: string; config: Record<string, unknown> }> = [];
    const allDeps: Array<{ source: string; target: string; type: string }> = [];
    let schedule: string | undefined;

    for (const wf of parsedData.workflows || []) {
      // Add session tasks
      for (const session of wf.sessions || []) {
        allTasks.push({
          id: `task-${allTasks.length + 1}`,
          name: session.name,
          type: "session",
          config: {
            mappingName: session.mappingName,
            workflowName: wf.name,
          },
        });
      }

      // Add workflow links as dependencies
      for (const link of wf.links || []) {
        allDeps.push({
          source: link.from,
          target: link.to,
          type: link.condition ? "conditional" : "sequential",
        });
      }

      if (wf.schedule && wf.schedule !== "ONDEMAND") {
        schedule = wf.schedule;
      }
    }

    // If no tasks from sessions, fall back to workflow task names
    if (allTasks.length === 0) {
      for (const wf of parsedData.workflows || []) {
        for (const taskName of wf.tasks || []) {
          allTasks.push({
            id: `task-${allTasks.length + 1}`,
            name: taskName,
            type: "execute",
            config: { workflowName: wf.name },
          });
        }
      }
    }

    const canonical: CanonicalPipeline = {
      version: "1.0",
      metadata: {
        name: projectName || parsedData.metadata?.folderName || "Untitled Pipeline",
        description: `Converted from ${sourceTool || "unknown"} | Repository: ${parsedData.metadata?.repositoryName || "N/A"} | Created: ${parsedData.metadata?.creationDate || "N/A"}`,
        sourceTool: sourceTool || "unknown",
        generatedAt: new Date().toISOString(),
      },
      sources,
      sinks,
      transformations,
      orchestration: {
        tasks: allTasks,
        dependencies: allDeps,
        schedule,
      },
      parameters: parsedData.parameters || [],
    };

    // Attach field-level lineage as extra metadata
    const response = {
      ...canonical,
      _fieldMappings: fieldMappings,
      _mappingSummary: (parsedData.mappings || []).map(
        (m: { name: string; source: string; target: string; fields: number; fieldMappings: unknown[] }) => ({
          name: m.name,
          source: m.source,
          target: m.target,
          fieldCount: m.fields,
          fieldMappings: m.fieldMappings,
        })
      ),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Normalize error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
