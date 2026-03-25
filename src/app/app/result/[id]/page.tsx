import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileJson,
  Info,
} from "lucide-react";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getOrCreateDbUser();

  const conversionRun = await prisma.conversionRun.findFirst({
    where: { id, project: { userId: dbUser.id } },
    include: {
      project: { select: { id: true, name: true } },
      canonicalModel: { select: { canonicalJson: true, schemaVersion: true } },
    },
  });

  if (!conversionRun) notFound();

  const output = conversionRun.outputJson as Record<string, unknown>;
  const validation = conversionRun.validationSummary as {
    errors?: Array<{ code: string; message: string }>;
    warnings?: Array<{ code: string; message: string; suggestion?: string }>;
    suggestions?: Array<{ code: string; message: string }>;
  };
  const canonical = conversionRun.canonicalModel?.canonicalJson as Record<string, unknown> | null;

  const errors = validation?.errors || [];
  const warnings = validation?.warnings || [];
  const suggestions = validation?.suggestions || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conversion Result</h1>
          <p className="text-sm text-gray-500 mt-1">{conversionRun.project.name}</p>
          <div className="flex items-center gap-3 mt-3">
            <Badge variant={conversionRun.status === "SUCCESS" ? "success" : conversionRun.status === "PARTIAL" ? "warning" : "error"}>
              {conversionRun.status}
            </Badge>
            <Badge variant="info">{conversionRun.targetPlatform}</Badge>
            <span className="text-xs text-gray-400">
              {new Date(conversionRun.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{warnings.length}</p>
            <p className="text-xs text-gray-500 mt-1">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-red-600">{errors.length}</p>
            <p className="text-xs text-gray-500 mt-1">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{suggestions.length}</p>
            <p className="text-xs text-gray-500 mt-1">Suggestions</p>
          </CardContent>
        </Card>
      </div>

      {/* Generated Output */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Generated Output ({conversionRun.targetPlatform})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-gray-900 p-4 text-sm text-green-400 overflow-x-auto font-mono leading-relaxed max-h-96">
            {JSON.stringify(output, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card>
        <CardHeader><CardTitle>Validation Report</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {errors.length === 0 && warnings.length === 0 && suggestions.length === 0 && (
            <div className="flex items-center gap-3 py-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">All validations passed with no issues.</p>
            </div>
          )}

          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">{err.code}</p>
                <p className="text-sm text-red-600 mt-0.5">{err.message}</p>
              </div>
            </div>
          ))}

          {warnings.map((warn, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">{warn.code}</p>
                <p className="text-sm text-yellow-700 mt-0.5">{warn.message}</p>
                {warn.suggestion && (
                  <p className="text-xs text-yellow-600 mt-1 bg-yellow-100 rounded p-2">💡 {warn.suggestion}</p>
                )}
              </div>
            </div>
          ))}

          {suggestions.map((sug, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">{sug.code}</p>
                <p className="text-sm text-blue-600 mt-0.5">{sug.message}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Canonical Model */}
      {canonical && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Canonical Pipeline Model (v{conversionRun.canonicalModel?.schemaVersion || "1.0"})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="rounded-lg bg-gray-900 p-4 text-sm text-blue-400 overflow-x-auto font-mono leading-relaxed max-h-64">
              {JSON.stringify(canonical, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Link href={`/app/project/${conversionRun.project.id}`}>
          <Button variant="outline">← Back to Project</Button>
        </Link>
        <Link href="/app">
          <Button variant="outline">Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
