import { NextRequest, NextResponse } from "next/server";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/projects — list user's projects
export async function GET() {
  try {
    const dbUser = await getOrCreateDbUser();
    const projects = await prisma.project.findMany({
      where: { userId: dbUser.id },
      include: {
        sourceFiles: { select: { id: true, filename: true } },
        conversionRuns: { select: { id: true, status: true, targetPlatform: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// POST /api/projects — create a new project
export async function POST(request: NextRequest) {
  try {
    const dbUser = await getOrCreateDbUser();
    const body = await request.json();
    const { name, description, targetPlatform } = body;

    if (!name) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        targetPlatform: targetPlatform || null,
        userId: dbUser.id,
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
