"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Download } from "lucide-react";

const targetPlatforms = [
  { id: "airflow", name: "Apache Airflow" },
  { id: "azure-data-factory", name: "Azure Data Factory" },
  { id: "databricks", name: "Databricks Workflows" },
  { id: "dagster", name: "Dagster" },
  { id: "prefect", name: "Prefect" },
  { id: "aws-glue", name: "AWS Glue" },
];

export default function ConvertPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedTarget, setSelectedTarget] = useState("airflow");
  const [useLLM, setUseLLM] = useState(true);
  const [converting, setConverting] = useState(false);
  const [converted, setConverted] = useState(false);
  const [result, setResult] = useState<{
    output: Record<string, unknown>;
    warnings: string[];
    score: number;
    mapped: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState("");

  const handleConvert = async () => {
    setConverting(true);
    setError("");

    try {
      // 1. Fetch parsed data for this project
      const projectRes = await fetch(`/api/projects/${params.id}`);
      if (!projectRes.ok) throw new Error("Failed to load project");
      const { project } = await projectRes.json();

      const parsedArtifact = project.parsedArtifacts?.[0];
      if (!parsedArtifact) throw new Error("No parsed data found. Upload and parse a file first.");

      const parsedData = parsedArtifact.parsedJson;

      // 2. Normalize to canonical model
      const normalizeRes = await fetch(`/api/normalize?llm=${useLLM}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedData,
          sourceTool: project.sourceTool || "unknown",
          projectName: project.name,
        }),
      });
      if (!normalizeRes.ok) throw new Error("Normalization failed");
      const canonical = await normalizeRes.json();

      // 3. Convert to target platform
      const convertRes = await fetch(`/api/convert?llm=${useLLM}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonical,
          targetPlatform: selectedTarget,
          projectId: params.id,
          parsedArtifactId: parsedArtifact.id,
        }),
      });
      if (!convertRes.ok) throw new Error("Conversion failed");
      const convertData = await convertRes.json();

      // 4. Validate
      const validateRes = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canonical,
          output: convertData.output,
          targetPlatform: selectedTarget,
        }),
      });
      const validation = validateRes.ok ? await validateRes.json() : { errors: [], warnings: [], suggestions: [] };

      // Calculate score
      const transformations = parsedData.transformations || [];
      const supported = transformations.filter((t: { supported: boolean }) => t.supported).length;
      const total = transformations.length || 1;
      const score = Math.round((supported / total) * 100);

      setResult({
        output: convertData.output,
        warnings: validation.warnings?.map((w: { message: string }) => w.message) || [],
        score,
        mapped: supported,
        total,
      });
      setConverted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Convert Pipeline</h1>
        <p className="text-sm text-gray-500 mt-1">
          Generate target platform artifacts from your parsed metadata.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Target Selection */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Select Target Platform</CardTitle>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">High-Accuracy Mode (LLM)</label>
            <input
              type="checkbox"
              checked={useLLM}
              onChange={(e) => setUseLLM(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {targetPlatforms.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => setSelectedTarget(platform.id)}
                disabled={converting || converted}
                className={`flex items-center justify-between rounded-lg border p-4 text-left transition-colors ${
                  selectedTarget === platform.id
                    ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                    : "border-gray-200 hover:border-gray-300"
                } disabled:opacity-50`}
              >
                <span className="font-medium text-sm text-gray-900">
                  {platform.name}
                </span>
                {selectedTarget === platform.id && (
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Result */}
      {converted && result && (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Successfully converted to {targetPlatforms.find(p => p.id === selectedTarget)?.name}
                  </p>
                  <p className="text-xs text-green-600 mt-0.5">
                    {result.mapped} of {result.total} transformations mapped
                    {result.warnings.length > 0 && ` • ${result.warnings.length} warning(s)`}
                  </p>
                </div>
              </div>

              {result.warnings.map((warn, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">{warn}</p>
                </div>
              ))}

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.score}%</p>
                  <p className="text-xs text-gray-500">Coverage</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.mapped}/{result.total}</p>
                  <p className="text-xs text-gray-500">Mapped</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-3 text-center">
                  <p className="text-2xl font-bold text-gray-900">{result.warnings.length}</p>
                  <p className="text-xs text-gray-500">Warnings</p>
                </div>
              </div>

              {/* Export & Preview */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(result.output, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${selectedTarget}-output.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export JSON
                </Button>
              </div>

              <details className="mt-2">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">Preview generated output</summary>
                <pre className="mt-2 rounded-lg bg-gray-900 p-4 text-sm text-green-400 overflow-x-auto font-mono leading-relaxed max-h-64">
                  {JSON.stringify(result.output, null, 2)}
                </pre>
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push(`/app/project/${params.id}/parse`)}
        >
          ← Back to Parse
        </Button>
        {converted ? (
          <Button onClick={() => router.push(`/app/project/${params.id}`)}>
            Back to Project <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleConvert} disabled={converting}>
            {converting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              <>Convert to {targetPlatforms.find(p => p.id === selectedTarget)?.name}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
