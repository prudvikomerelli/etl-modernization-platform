import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PATCH /api/projects/:id — update project fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getOrCreateDbUser();
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const project = await prisma.project.findFirst({
      where: { id, userId: dbUser.id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Only allow updating specific fields
    const allowedFields: Record<string, any> = {};
    if (body.sourceTool !== undefined) allowedFields.sourceTool = body.sourceTool;
    if (body.targetPlatform !== undefined) allowedFields.targetPlatform = body.targetPlatform;
    if (body.name !== undefined) allowedFields.name = body.name;
    if (body.description !== undefined) allowedFields.description = body.description;

    const updated = await prisma.project.update({
      where: { id },
      data: allowedFields,
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("PATCH /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// DELETE /api/projects/:id — delete a project and all related data (cascading)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getOrCreateDbUser();
    const { id } = await params;

    // Verify ownership before deleting
    const project = await prisma.project.findFirst({
      where: { id, userId: dbUser.id },
      select: { id: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}

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
        conversionRuns: { orderBy: { createdAt: "desc" } },
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
