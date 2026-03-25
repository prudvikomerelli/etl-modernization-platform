import { NextRequest, NextResponse } from "next/server";
import { DetectSourceResult, SourceETLTool } from "@/types";

const SOURCE_SIGNATURES: Record<SourceETLTool, string[]> = {
  informatica: ["POWERMART", "REPOSITORY", "FOLDER", "MAPPING", "SOURCE", "TARGET", "TRANSFORMATION"],
  talend: ["talendfile:ProcessType", "parameters", "node", "connection", "metadata"],
  datastage: ["DSJobDefSDO", "has_InputPin", "has_OutputPin", "DSStageSDO"],
  ssis: ["DTS:Executable", "DTS:ConnectionManager", "DTS:Property", "pipeline"],
  abinitio: ["graph", "component", "port", "flow", "parameter"],
  unknown: [],
};

function detectSource(xmlContent: string): DetectSourceResult {
  const upperContent = xmlContent.toUpperCase();
  let bestMatch: SourceETLTool = "unknown";
  let bestScore = 0;
  const matchedSignatures: string[] = [];

  for (const [tool, signatures] of Object.entries(SOURCE_SIGNATURES)) {
    if (tool === "unknown") continue;
    const matches = signatures.filter((sig) => upperContent.includes(sig.toUpperCase()));
    const score = matches.length / signatures.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tool as SourceETLTool;
      matchedSignatures.length = 0;
      matchedSignatures.push(...matches);
    }
  }

  return {
    detectedTool: bestMatch,
    confidence: Math.round(bestScore * 100) / 100,
    signatures: matchedSignatures,
  };
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { content, filename } = body;
    console.log("detect-source received:", { filename, contentLength: content?.length, contentType: typeof content });

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    if (filename && !filename.toLowerCase().endsWith(".xml")) {
      return NextResponse.json({ error: "File must be XML" }, { status: 400 });
    }

    let result;
    const useLLM = request.nextUrl.searchParams.get("llm") !== "false";

    if (useLLM) {
      const { callLLM } = await import("@/lib/llm-service");
      const llmResult = await callLLM("detect", content);
      result = {
        detectedTool: llmResult.sourceTool,
        confidence: llmResult.confidence,
        signatures: llmResult.reasoning ? [llmResult.reasoning] : [],
      };
    } else {
      result = detectSource(content);
    }

    return NextResponse.json({
      sourceTool: result.detectedTool,
      confidence: result.confidence,
      signatures: result.signatures,
    });
  } catch (error) {
    console.error("Source detection error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
