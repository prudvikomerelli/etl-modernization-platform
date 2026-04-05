import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { XMLParser } from "fast-xml-parser";
import { logger } from "@/lib/logger";
import { startStep, completeStep, failStep } from "@/lib/step-tracker";

interface PowermartSource {
  "@_NAME": string;
  "@_DATABASETYPE"?: string;
  "@_DBDNAME"?: string;
  "@_DESCRIPTION"?: string;
  SOURCEFIELD?: PowermartField | PowermartField[];
  GROUP?: unknown;
}

interface PowermartTarget {
  "@_NAME": string;
  "@_DATABASETYPE"?: string;
  "@_DESCRIPTION"?: string;
  TARGETFIELD?: PowermartField | PowermartField[];
}

interface PowermartField {
  "@_NAME": string;
  "@_DATATYPE"?: string;
  "@_PRECISION"?: string;
  "@_SCALE"?: string;
  "@_NULLABLE"?: string;
  "@_KEYTYPE"?: string;
  "@_GROUP"?: string;
  "@_EXPRESSION"?: string;
  "@_PORTTYPE"?: string;
}

interface PowermartTransformation {
  "@_NAME": string;
  "@_TYPE"?: string;
  "@_REUSABLE"?: string;
  "@_DESCRIPTION"?: string;
  TRANSFORMFIELD?: PowermartField | PowermartField[];
}

interface PowermartConnector {
  "@_FROMFIELD": string;
  "@_FROMINSTANCE": string;
  "@_FROMINSTANCETYPE"?: string;
  "@_TOFIELD": string;
  "@_TOINSTANCE": string;
  "@_TOINSTANCETYPE"?: string;
}

interface PowermartInstance {
  "@_NAME": string;
  "@_TRANSFORMATION_NAME"?: string;
  "@_TRANSFORMATION_TYPE"?: string;
  "@_TYPE"?: string;
}

interface PowermartMapping {
  "@_NAME": string;
  "@_DESCRIPTION"?: string;
  "@_ISVALID"?: string;
  TRANSFORMATION?: PowermartTransformation | PowermartTransformation[];
  CONNECTOR?: PowermartConnector | PowermartConnector[];
  INSTANCE?: PowermartInstance | PowermartInstance[];
}

interface PowermartWorkflow {
  "@_NAME": string;
  "@_DESCRIPTION"?: string;
  "@_ISENABLED"?: string;
  SESSION?: unknown | unknown[];
  TASK?: unknown | unknown[];
  TASKINSTANCE?: unknown | unknown[];
  WORKFLOWLINK?: unknown | unknown[];
  SCHEDULER?: unknown;
}

function toArray<T>(val: T | T[] | undefined): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

export async function POST(request: NextRequest) {
  let stepHandle: Awaited<ReturnType<typeof startStep>> = null;
  try {
    const contentType = request.headers.get("content-type") || "";
    let content: string;
    let filename: string;
    let projectId: string | null = null;
    let sourceTool: string | null = null;
    let fileSize: number = 0;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }
      content = await file.text();
      filename = file.name;
      fileSize = file.size;
      sourceTool = formData.get("sourceTool") as string | null;
      projectId = formData.get("projectId") as string | null;
    } else {
      const body = await request.json();
      content = body.content;
      filename = body.filename || "upload.xml";
      projectId = body.projectId || null;
      sourceTool = body.sourceTool || null;
      fileSize = body.fileSize || Buffer.byteLength(content, "utf-8");

      if (!content) {
        return NextResponse.json({ error: "No content provided" }, { status: 400 });
      }
    }

    logger.api("/api/parse", "POST", { filename, projectId, sourceTool });

    const useLLM = request.nextUrl.searchParams.get("llm") !== "false";
    let parsedResult: any = {};
    stepHandle = projectId ? await startStep(projectId, "parse", { filename, sourceTool }) : null;

    if (useLLM) {
      const { callLLM } = await import("@/lib/llm-service");
      const llmResponse = await callLLM("parse", content);
      
      // Flexible extraction with alias mapping
      const base = llmResponse.data || llmResponse.parsedResult || llmResponse;
      
      parsedResult = {
        sources: base.sources || base.source_definitions || base.SourceDefinitions || [],
        targets: base.targets || base.target_definitions || base.TargetDefinitions || [],
        mappings: base.mappings || base.mapping_definitions || [],
        workflows: base.workflows || base.workflow_definitions || [],
        transformations: base.transformations || base.transformation_definitions || base.tx || [],
        connectors: base.connectors || base.links || [],
        parameters: base.parameters || base.variables || [],
        warnings: base.warnings || [],
        metadata: base.metadata || {
          repositoryName: "AI Analysis",
          folderName: filename,
          creationAt: new Date().toISOString()
        }
      };

      // Ensure sub-arrays like fields/sessions are never undefined for the UI
      parsedResult.sources = parsedResult.sources.map((s: any) => ({ ...s, fields: s.fields || s.columns || [] }));
      parsedResult.targets = parsedResult.targets.map((t: any) => ({ ...t, fields: t.fields || t.columns || [] }));
      parsedResult.transformations = parsedResult.transformations.map((t: any) => ({ ...t, fields: t.fields || [] }));
      parsedResult.workflows = parsedResult.workflows.map((w: any) => ({ ...w, sessions: w.sessions || [] }));
    } else {
      // Parse XML with fast-xml-parser
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        allowBooleanAttributes: true,
        trimValues: true,
      });
      const xmlDoc = parser.parse(content);

      const powermart = xmlDoc.POWERMART;
      const repository = powermart?.REPOSITORY;
      const folders = toArray(repository?.FOLDER);

      parsedResult = {
        mappings: [] as any[],
        workflows: [] as any[],
        transformations: [] as any[],
        sources: [] as any[],
        targets: [] as any[],
        connectors: [] as any[],
        parameters: [] as any[],
        warnings: [] as string[],
        metadata: {
          repositoryName: repository?.["@_NAME"] || "",
          folderName: folders[0]?.["@_NAME"] || "",
          creationDate: powermart?.["@_CREATION_DATE"] || "",
        },
      };

      for (const folder of folders) {
        // Sources
        for (const src of toArray<PowermartSource>(folder.SOURCE)) {
          parsedResult.sources.push({
            name: src["@_NAME"] || "",
            databaseType: src["@_DATABASETYPE"] || "",
            fields: toArray<PowermartField>(src.SOURCEFIELD).map(f => ({
              name: f["@_NAME"] || "",
              dataType: f["@_DATATYPE"] || "",
            }))
          });
        }
        // Targets
        for (const tgt of toArray<PowermartTarget>(folder.TARGET)) {
          parsedResult.targets.push({
            name: tgt["@_NAME"] || "",
            databaseType: tgt["@_DATABASETYPE"] || "",
            fields: toArray<PowermartField>(tgt.TARGETFIELD).map(f => ({
              name: f["@_NAME"] || "",
              dataType: f["@_DATATYPE"] || "",
            }))
          });
        }
        // Mappings
        for (const mapping of toArray<PowermartMapping>(folder.MAPPING)) {
          parsedResult.mappings.push({
            name: mapping["@_NAME"] || "",
            description: mapping["@_DESCRIPTION"] || "",
            isValid: mapping["@_ISVALID"] === "YES",
          });
          // Transformations
          for (const tx of toArray<PowermartTransformation>(mapping.TRANSFORMATION)) {
            parsedResult.transformations.push({
              name: tx["@_NAME"] || "",
              type: tx["@_TYPE"] || "Unknown",
              fields: toArray<PowermartField>(tx.TRANSFORMFIELD).map(f => ({
                name: f["@_NAME"] || "",
                expression: f["@_EXPRESSION"] || "",
              }))
            });
          }
        }
        // Workflows
        for (const wf of toArray<PowermartWorkflow>(folder.WORKFLOW)) {
          parsedResult.workflows.push({
            name: wf["@_NAME"] || "",
            isEnabled: wf["@_ISENABLED"] === "YES",
            sessions: toArray<any>(wf.SESSION).map(s => ({ name: s["@_NAME"], mappingName: s["@_MAPPINGNAME"] }))
          });
        }
      }
    }

    // MANDATORY DATABASE PERSISTENCE
    if (projectId) {
      try {
        await getOrCreateDbUser();
        const checksum = crypto.createHash("md5").update(content).digest("hex");

        const sourceFile = await prisma.sourceFile.create({
          data: {
            projectId,
            filename,
            storagePath: `uploads/${projectId}/${filename}`,
            checksum,
            fileSizeBytes: BigInt(fileSize),
          },
        });

        await prisma.parsedArtifact.create({
          data: {
            projectId,
            sourceFileId: sourceFile.id,
            parsedJson: JSON.parse(JSON.stringify(parsedResult)), // Ensure clean JSON
            detectedSourceTool: sourceTool,
            warnings: parsedResult.warnings.length > 0 ? parsedResult.warnings : undefined,
          },
        });

        if (sourceTool) {
          await prisma.project.update({
            where: { id: projectId },
            data: { sourceTool },
          });
        }
        logger.info("Successfully persisted parsed artifact to DB", { projectId });
      } catch (dbError) {
        logger.error("DB storage error", { projectId, error: String(dbError) });
      }
    }

    await completeStep(stepHandle, { sourceCount: parsedResult.sources?.length, targetCount: parsedResult.targets?.length });
    return NextResponse.json(parsedResult);
  } catch (error) {
    logger.error("Parse error", { error: String(error) });
    await failStep(stepHandle, String(error));
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
