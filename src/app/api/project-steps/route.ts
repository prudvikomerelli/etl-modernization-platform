import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const projectId = request.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const dbUser = await getOrCreateDbUser();

    // Verify project belongs to user
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: dbUser.id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const steps = await prisma.conversionStep.findMany({
      where: { projectId },
      orderBy: { startedAt: "asc" },
      select: {
        id: true,
        step: true,
        status: true,
        durationMs: true,
        errorMessage: true,
        startedAt: true,
        completedAt: true,
      },
    });

    logger.api("/api/project-steps", "GET", { projectId, stepCount: steps.length });
    return NextResponse.json({ steps });
  } catch (error) {
    logger.error("Project steps fetch error", { error: String(error) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
