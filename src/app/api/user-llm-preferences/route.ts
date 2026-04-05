import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { getLLMConfig, saveLLMConfig } from "@/lib/llm-config";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const dbUser = await getOrCreateDbUser();
    const config = await getLLMConfig(dbUser.id);
    return NextResponse.json(config);
  } catch (error) {
    logger.error("Failed to fetch LLM preferences", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const dbUser = await getOrCreateDbUser();
    const body = await request.json();

    const { model, temperature, topP, maxTokens } = body;

    // Validate inputs
    if (temperature !== undefined && (temperature < 0 || temperature > 2)) {
      return NextResponse.json({ error: "Temperature must be between 0 and 2" }, { status: 400 });
    }
    if (topP !== undefined && (topP < 0 || topP > 1)) {
      return NextResponse.json({ error: "Top P must be between 0 and 1" }, { status: 400 });
    }
    if (maxTokens !== undefined && (maxTokens < 100 || maxTokens > 128000)) {
      return NextResponse.json({ error: "Max tokens must be between 100 and 128000" }, { status: 400 });
    }

    const config = await saveLLMConfig(dbUser.id, { model, temperature, topP, maxTokens });
    logger.api("/api/user-llm-preferences", "POST", { userId: dbUser.id });
    return NextResponse.json(config);
  } catch (error) {
    logger.error("Failed to save LLM preferences", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
