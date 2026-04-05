"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, Download, RefreshCw, Clock } from "lucide-react";

const targetPlatforms = [
  { id: "airflow", name: "Apache Airflow" },
  { id: "azure-data-factory", name: "Azure Data Factory" },
  { id: "databricks", name: "Databricks Workflows" },
  { id: "dagster", name: "Dagster" },
  { id: "prefect", name: "Prefect" },
  { id: "aws-glue", name: "AWS Glue" },
];

interface ConversionRunInfo {
  id: string;
  targetPlatform: string;
  status: string;
  outputJson: Record<string, unknown>;
  validationSummary: Record<string, unknown>;
  warnings: string[] | null;
  createdAt: string;
}

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
  const [loading, setLoading] = useState(true);
  const [previousRuns, setPreviousRuns] = useState<ConversionRunInfo[]>([]);
  const [viewingRunId, setViewingRunId] = useState<string | null>(null);
  const [showNewConversion, setShowNewConversion] = useState(false);

  // Load existing conversion runs on mount
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          const { project } = await res.json();
          
          // Pre-select the project's target platform
          if (project.targetPlatform) {
            setSelectedTarget(project.targetPlatform);
          }

          // Load previous conversion runs
          if (project.conversionRuns && project.conversionRuns.length > 0) {
            setPreviousRuns(project.conversionRuns);
            // Show the latest run by default
            const latestRun = project.conversionRuns[0];
            setViewingRunId(latestRun.id);
            setResult({
              output: latestRun.outputJson,
              warnings: latestRun.warnings || [],
              score: 0,
              mapped: 0,
              total: 0,
            });
            setConverted(true);
            setSelectedTarget(latestRun.targetPlatform);
          }
        }
      } catch {
        // Non-fatal
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [params.id]);

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
          projectId: params.id,
          parsedArtifactId: parsedArtifact.id,
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

      const newResult = {
        output: convertData.output,
        warnings: validation.warnings?.map((w: { message: string }) => w.message) || [],
        score,
        mapped: supported,
        total,
      };

      setResult(newResult);
      setConverted(true);
      setShowNewConversion(false);
      setViewingRunId(null);

      // Add to previous runs list
      setPreviousRuns(prev => [{
        id: convertData.conversionRunId || `new-${Date.now()}`,
        targetPlatform: selectedTarget,
        status: "SUCCESS",
        outputJson: convertData.output,
        validationSummary: {},
        warnings: validation.warnings?.map((w: { message: string }) => w.message) || null,
        createdAt: new Date().toISOString(),
      }, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Conversion failed");
    } finally {
      setConverting(false);
    }
  };

  const viewRun = (run: ConversionRunInfo) => {
    setViewingRunId(run.id);
    setSelectedTarget(run.targetPlatform);
    setResult({
      output: run.outputJson,
      warnings: run.warnings || [],
      score: 0,
      mapped: 0,
      total: 0,
    });
    setConverted(true);
    setShowNewConversion(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading conversions...</span>
      </div>
    );
  }

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

      {/* Previous Conversion Runs */}
      {previousRuns.length > 0 && !showNewConversion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Conversion Runs</span>
              <Button variant="outline" size="sm" onClick={() => {
                setShowNewConversion(true);
                setConverted(false);
                setResult(null);
                setViewingRunId(null);
              }}>
                <RefreshCw className="h-4 w-4 mr-1" />
                New Conversion
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {previousRuns.map((run, index) => (
                <button
                  key={run.id}
                  onClick={() => viewRun(run)}
                  className={`w-full flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                    viewingRunId === run.id
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
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
                        Run #{previousRuns.length - index} → {targetPlatforms.find(p => p.id === run.targetPlatform)?.name || run.targetPlatform}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(run.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    run.status === "SUCCESS" ? "success" :
                    run.status === "PARTIAL" ? "warning" : "error"
                  }>
                    {run.status}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Result (viewing previous or just-completed) */}
      {converted && result && !showNewConversion && (
        <Card>
          <CardHeader>
            <CardTitle>
              {viewingRunId ? "Conversion Output" : "Conversion Complete"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Converted to {targetPlatforms.find(p => p.id === selectedTarget)?.name}
                  </p>
                  {result.total > 0 && (
                    <p className="text-xs text-green-600 mt-0.5">
                      {result.mapped} of {result.total} transformations mapped
                      {result.warnings.length > 0 && ` • ${result.warnings.length} warning(s)`}
                    </p>
                  )}
                </div>
              </div>

              {result.warnings.length > 0 && result.warnings.map((warn, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">{warn}</p>
                </div>
              ))}

              {result.total > 0 && (
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
              )}

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

      {/* New Conversion Form */}
      {(showNewConversion || (!converted && previousRuns.length === 0)) && (
        <>
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
                    disabled={converting}
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
        </>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (showNewConversion && previousRuns.length > 0) {
              setShowNewConversion(false);
              // Restore last viewed run
              if (previousRuns.length > 0) {
                viewRun(previousRuns[0]);
              }
            } else {
              router.push(`/app/project/${params.id}/parse`);
            }
          }}
        >
          {showNewConversion && previousRuns.length > 0 ? "Cancel" : "← Back to Parse"}
        </Button>
        {converted && !showNewConversion ? (
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
