import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/projects/:id — get single project with all related data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getOrCreateDbUser();
    const { id } = await params;

    const project = await prisma.project.findFirst({
      where: { id, userId: dbUser.id },
      include: {
        sourceFiles: true,
        parsedArtifacts: { orderBy: { createdAt: "desc" } },
        canonicalModels: true,
        conversionRuns: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Convert BigInt fields to Number for JSON serialization
    const serialized = JSON.parse(
      JSON.stringify(project, (_key, value) =>
        typeof value === "bigint" ? Number(value) : value
      )
    );
    return NextResponse.json({ project: serialized });
  } catch (error) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}
