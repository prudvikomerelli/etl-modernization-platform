import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileSearch,
  GitCompare,
  Download,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConversionTimeline from "./components/conversion-timeline";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getOrCreateDbUser();

  const project = await prisma.project.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      sourceFiles: { select: { id: true } },
      parsedArtifacts: { select: { id: true } },
      conversionRuns: {
        select: { id: true, status: true, targetPlatform: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!project) notFound();

  const hasFiles = project.sourceFiles.length > 0;
  const hasParsed = project.parsedArtifacts.length > 0;
  const hasConversions = project.conversionRuns.length > 0;

  const steps = [
    {
      name: "Upload XML",
      description: "Upload your ETL export file",
      icon: Upload,
      href: "upload",
      status: hasFiles ? "complete" : "current",
    },
    {
      name: "Parse Metadata",
      description: "Explore extracted mappings and workflows",
      icon: FileSearch,
      href: "parse",
      status: hasParsed ? "complete" : hasFiles ? "current" : "pending",
    },
    {
      name: "Convert",
      description: "Generate target platform artifacts",
      icon: GitCompare,
      href: "convert",
      status: hasConversions ? "complete" : hasParsed ? "current" : "pending",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
          <div className="flex items-center gap-3 mt-3">
            {project.sourceTool && <Badge variant="info">{project.sourceTool}</Badge>}
            {project.sourceTool && project.targetPlatform && (
              <span className="text-gray-400">→</span>
            )}
            {project.targetPlatform && <Badge variant="success">{project.targetPlatform}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/app/project/${project.id}/convert`}>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </Link>
        </div>
      </div>

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step) => (
              <Link
                key={step.name}
                href={`/app/project/${project.id}/${step.href}`}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`rounded-full p-2 ${
                    step.status === "complete"
                      ? "bg-green-100"
                      : step.status === "current"
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}
                >
                  {step.status === "complete" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <step.icon
                      className={`h-5 w-5 ${
                        step.status === "current"
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{step.name}</p>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Timeline */}
      <ConversionTimeline projectId={project.id} />

      {/* Conversion History */}
      {project.conversionRuns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversion History</span>
              <Badge variant="info">{project.conversionRuns.length} run{project.conversionRuns.length !== 1 ? "s" : ""}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.conversionRuns.map((run, index) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-1.5 ${
                      run.status === "SUCCESS" ? "bg-green-100" :
                      run.status === "PARTIAL" ? "bg-yellow-100" : "bg-red-100"
                    }`}>
                      <CheckCircle className={`h-4 w-4 ${
                        run.status === "SUCCESS" ? "text-green-600" :
                        run.status === "PARTIAL" ? "text-yellow-600" : "text-red-600"
                      }`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Run #{project.conversionRuns.length - index}
                      </p>
                      <p className="text-xs text-gray-500">
                        Target: {run.targetPlatform}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={
                      run.status === "SUCCESS" ? "success" :
                      run.status === "PARTIAL" ? "warning" : "error"
                    }>
                      {run.status}
                    </Badge>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Info */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-gray-500">Last Updated</p>
            <p className="text-sm font-medium text-gray-900 flex items-center gap-1 mt-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(project.updatedAt).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
