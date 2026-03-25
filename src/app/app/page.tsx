import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  PlusCircle,
  FolderOpen,
  ArrowRight,
  Clock,
  FileJson,
  Activity,
} from "lucide-react";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusVariant: Record<string, "success" | "warning" | "error"> = {
  SUCCESS: "success",
  PARTIAL: "warning",
  FAILED: "error",
};

export default async function DashboardPage() {
  const dbUser = await getOrCreateDbUser();

  const projects = await prisma.project.findMany({
    where: { userId: dbUser.id },
    include: {
      conversionRuns: { select: { id: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  const totalConversions = projects.reduce(
    (sum, p) => sum + p.conversionRuns.length,
    0
  );

  const hasProjects = projects.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your ETL conversion projects
          </p>
        </div>
        <Link href="/app/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Conversion
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <FolderOpen className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
              <p className="text-sm text-gray-500">Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-green-50 p-3">
              <FileJson className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalConversions}</p>
              <p className="text-sm text-gray-500">Conversions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="rounded-lg bg-purple-50 p-3">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {dbUser.subscription?.plan || "FREE"}
              </p>
              <p className="text-sm text-gray-500">Current Plan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {hasProjects ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {projects.map((project) => {
              const latestStatus =
                project.conversionRuns[project.conversionRuns.length - 1]?.status ||
                "PENDING";
              return (
                <Link
                  key={project.id}
                  href={`/app/project/${project.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <FolderOpen className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{project.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 capitalize">
                          {project.sourceTool || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-400">→</span>
                        <span className="text-xs text-gray-500">
                          {project.targetPlatform || "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {statusVariant[latestStatus] && (
                      <Badge variant={statusVariant[latestStatus]}>
                        {latestStatus}
                      </Badge>
                    )}
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState
            icon={FolderOpen}
            title="No projects yet"
            description="Create your first conversion project to get started with ETL modernization."
            actionLabel="New Conversion"
            actionHref="/app/new"
          />
        </Card>
      )}
    </div>
  );
}
