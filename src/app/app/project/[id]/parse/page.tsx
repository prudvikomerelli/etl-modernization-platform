import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ArrowRight,
  Database,
  GitBranch,
  Layers,
  Link2,
  Variable,
  FileSearch,
} from "lucide-react";
import { getOrCreateDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ParsedData {
  mappings?: Array<{
    name: string; source: string; target: string; fields: number;
    fieldMappings?: Array<{ sourceField: string; targetField: string; sourceInstance: string; targetInstance: string }>;
  }>;
  workflows?: Array<{
    name: string; tasks: string[]; schedule: string | null;
    sessions?: Array<{ name: string; mappingName: string }>;
    links?: Array<{ from: string; to: string; condition: string }>;
  }>;
  transformations?: Array<{
    name: string; type: string; supported: boolean; notes?: string;
    fields?: Array<{ name: string; dataType: string; expression: string; portType: string }>;
  }>;
  sources?: Array<{
    name: string; databaseType: string; dbdName: string;
    fields: Array<{ name: string; dataType: string; nullable: boolean; keyType: string; group: string }>;
  }>;
  targets?: Array<{
    name: string; databaseType: string;
    fields: Array<{ name: string; dataType: string; nullable: boolean; keyType: string }>;
  }>;
  connectors?: Array<{
    fromField: string; fromInstance: string; fromInstanceType: string;
    toField: string; toInstance: string; toInstanceType: string;
  }>;
  parameters?: Array<{ name: string; value: string; type: string; scope: string }>;
  metadata?: { repositoryName: string; folderName: string; creationDate: string };
}

export default async function ParsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dbUser = await getOrCreateDbUser();

  const project = await prisma.project.findFirst({
    where: { id, userId: dbUser.id },
    include: {
      parsedArtifacts: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!project) notFound();

  const artifact = project.parsedArtifacts[0];

  if (!artifact) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parsed Metadata</h1>
          <p className="text-sm text-gray-500 mt-1">No parsed data yet. Upload an XML file first.</p>
        </div>
        <Card>
          <EmptyState
            icon={FileSearch}
            title="No parsed data"
            description="Upload an XML export file to see extracted pipeline metadata here."
            actionLabel="Go to Upload"
            actionHref={`/app/project/${id}/upload`}
          />
        </Card>
      </div>
    );
  }

  const parsed = artifact.parsedJson as unknown as ParsedData;
  const mappings = parsed.mappings || [];
  const workflows = parsed.workflows || [];
  const transformations = parsed.transformations || [];
  const connectors = parsed.connectors || [];
  const parameters = parsed.parameters || [];
  const sources = parsed.sources || [];
  const targets = parsed.targets || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Parsed Metadata</h1>
          <p className="text-sm text-gray-500 mt-1">
            Extracted pipeline components from your XML export.
            {artifact.detectedSourceTool && (
              <> Source: <span className="capitalize font-medium">{artifact.detectedSourceTool}</span></>
            )}
          </p>
        </div>
        <Link href={`/app/project/${id}/convert`}>
          <Button>
            Continue to Convert <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Metadata */}
      {parsed.metadata && (
        <div className="text-xs text-gray-500 flex gap-4">
          {parsed.metadata.repositoryName && <span>Repository: <strong>{parsed.metadata.repositoryName}</strong></span>}
          {parsed.metadata.folderName && <span>Folder: <strong>{parsed.metadata.folderName}</strong></span>}
          {parsed.metadata.creationDate && <span>Created: <strong>{parsed.metadata.creationDate}</strong></span>}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-3 lg:grid-cols-7">
        {[
          { label: "Sources", count: sources.length, icon: Database, color: "blue" },
          { label: "Targets", count: targets.length, icon: Database, color: "green" },
          { label: "Mappings", count: mappings.length, icon: Database, color: "indigo" },
          { label: "Workflows", count: workflows.length, icon: GitBranch, color: "teal" },
          { label: "Transforms", count: transformations.length, icon: Layers, color: "purple" },
          { label: "Connectors", count: connectors.length, icon: Link2, color: "orange" },
          { label: "Parameters", count: parameters.length, icon: Variable, color: "gray" },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="py-3 text-center">
              <item.icon className={`h-5 w-5 mx-auto mb-1 text-${item.color}-600`} />
              <p className="text-2xl font-bold text-gray-900">{item.count}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mappings */}
      {mappings.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Mappings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {mappings.map((m) => (
              <div key={m.name} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{m.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="font-mono">{m.source}</span>
                    <ArrowRight className="h-3 w-3" />
                    <span className="font-mono">{m.target}</span>
                    <Badge>{m.fields} fields</Badge>
                  </div>
                </div>
                {m.fieldMappings && m.fieldMappings.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-2 py-1 text-left text-gray-500">Source Field</th>
                        <th className="px-2 py-1 text-center text-gray-400">→</th>
                        <th className="px-2 py-1 text-left text-gray-500">Target Field</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {m.fieldMappings.map((fm) => (
                        <tr key={`${fm.sourceField}-${fm.targetField}`}>
                          <td className="px-2 py-1 font-mono text-gray-700">{fm.sourceInstance}.{fm.sourceField}</td>
                          <td className="px-2 py-1 text-center text-gray-300">→</td>
                          <td className="px-2 py-1 font-mono text-gray-700">{fm.targetInstance}.{fm.targetField}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Workflows */}
      {workflows.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Workflows</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {workflows.map((wf) => (
              <div key={wf.name} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{wf.name}</h3>
                  {wf.schedule && <Badge variant="info">Cron: {wf.schedule}</Badge>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {wf.tasks.map((task, i) => (
                    <div key={task} className="flex items-center gap-1">
                      <span className="rounded bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-700">{task}</span>
                      {i < wf.tasks.length - 1 && <ArrowRight className="h-3 w-3 text-gray-400" />}
                    </div>
                  ))}
                  {wf.tasks.length === 0 && <span className="text-xs text-gray-400">No tasks detected</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Transformations */}
      {transformations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Transformations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transformations.map((t) => (
                  <tr key={t.name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">{t.name}</td>
                    <td className="px-6 py-3 text-gray-600">{t.type}</td>
                    <td className="px-6 py-3">
                      <Badge variant={t.supported ? "success" : "warning"}>
                        {t.supported ? "Supported" : "Unsupported"}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-gray-500 text-xs">{t.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Sources</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {sources.map((src) => (
              <div key={src.name} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-4 w-4 text-blue-500" />
                  <h3 className="font-medium text-gray-900">{src.name}</h3>
                  <Badge variant="info">{src.databaseType}</Badge>
                  {src.dbdName && <Badge>{src.dbdName}</Badge>}
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-2 py-1 text-left text-gray-500">Field</th>
                      <th className="px-2 py-1 text-left text-gray-500">Type</th>
                      <th className="px-2 py-1 text-left text-gray-500">Key</th>
                      <th className="px-2 py-1 text-left text-gray-500">Nullable</th>
                      <th className="px-2 py-1 text-left text-gray-500">Group</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {src.fields.map((f: any) => (
                      <tr key={typeof f.name === 'object' ? JSON.stringify(f.name) : f.name}>
                        <td className="px-2 py-1 font-mono text-gray-900">
                          {typeof f.name === 'object' ? (f.name.name || JSON.stringify(f.name)) : f.name}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {typeof f.dataType === 'object' ? (f.dataType.name || JSON.stringify(f.dataType)) : f.dataType}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {typeof f.keyType === 'object' ? JSON.stringify(f.keyType) : f.keyType}
                        </td>
                        <td className="px-2 py-1">{f.nullable ? "Yes" : "No"}</td>
                        <td className="px-2 py-1 text-gray-500">
                          {typeof f.group === 'object' ? JSON.stringify(f.group) : f.group}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Targets */}
      {targets.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Targets</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {targets.map((tgt) => (
              <div key={tgt.name} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Database className="h-4 w-4 text-green-500" />
                  <h3 className="font-medium text-gray-900">{tgt.name}</h3>
                  <Badge variant="success">{tgt.databaseType}</Badge>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-2 py-1 text-left text-gray-500">Field</th>
                      <th className="px-2 py-1 text-left text-gray-500">Type</th>
                      <th className="px-2 py-1 text-left text-gray-500">Key</th>
                      <th className="px-2 py-1 text-left text-gray-500">Nullable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {tgt.fields.map((f: any) => (
                      <tr key={typeof f.name === 'object' ? JSON.stringify(f.name) : f.name}>
                        <td className="px-2 py-1 font-mono text-gray-900">
                          {typeof f.name === 'object' ? (f.name.name || JSON.stringify(f.name)) : f.name}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {typeof f.dataType === 'object' ? (f.dataType.name || JSON.stringify(f.dataType)) : f.dataType}
                        </td>
                        <td className="px-2 py-1 text-gray-600">
                          {typeof f.keyType === 'object' ? JSON.stringify(f.keyType) : f.keyType}
                        </td>
                        <td className="px-2 py-1">{f.nullable ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Connectors (Field-Level Lineage) */}
      {connectors.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Connectors ({connectors.length} field mappings)</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2 text-left text-gray-600">From Instance</th>
                  <th className="px-4 py-2 text-left text-gray-600">Field</th>
                  <th className="px-4 py-2 text-center text-gray-400">→</th>
                  <th className="px-4 py-2 text-left text-gray-600">To Instance</th>
                  <th className="px-4 py-2 text-left text-gray-600">Field</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {connectors.map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-1.5">
                      <span className="font-mono text-gray-900">{c.fromInstance}</span>
                      <span className="ml-1 text-gray-400 text-[10px]">({c.fromInstanceType})</span>
                    </td>
                    <td className="px-4 py-1.5 font-mono text-gray-700">{c.fromField}</td>
                    <td className="px-4 py-1.5 text-center text-gray-300">→</td>
                    <td className="px-4 py-1.5">
                      <span className="font-mono text-gray-900">{c.toInstance}</span>
                      <span className="ml-1 text-gray-400 text-[10px]">({c.toInstanceType})</span>
                    </td>
                    <td className="px-4 py-1.5 font-mono text-gray-700">{c.toField}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Parameters */}
      {parameters.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Parameters</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Parameter</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Value</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-600">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {parameters.map((p) => (
                  <tr key={p.name} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-gray-900">{p.name}</td>
                    <td className="px-6 py-3 font-mono text-gray-600">{p.value || "—"}</td>
                    <td className="px-6 py-3 text-gray-600">{p.type}</td>
                    <td className="px-6 py-3 text-gray-600">{p.scope}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Link href={`/app/project/${id}`}>
          <Button variant="outline">Back to Project</Button>
        </Link>
        <Link href={`/app/project/${id}/convert`}>
          <Button>Continue to Convert <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </Link>
      </div>
    </div>
  );
}
