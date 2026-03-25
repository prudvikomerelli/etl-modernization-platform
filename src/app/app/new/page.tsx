"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileUp, ArrowRight } from "lucide-react";

const targetPlatforms = [
  { id: "airflow", name: "Apache Airflow", description: "DAG definitions" },
  { id: "azure-data-factory", name: "Azure Data Factory", description: "ARM templates" },
  { id: "databricks", name: "Databricks Workflows", description: "Job JSON configs" },
  { id: "dagster", name: "Dagster", description: "Asset definitions" },
  { id: "prefect", name: "Prefect", description: "Flow definitions" },
  { id: "aws-glue", name: "AWS Glue", description: "Job configurations" },
];

export default function NewConversionPage() {
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".xml")) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          description,
          targetPlatform: selectedTarget,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create project");
      }

      const { project } = await res.json();
      router.push(`/app/project/${project.id}/upload`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Conversion Project</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your legacy ETL export and configure the target platform.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {/* Project Info */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Q1 Data Pipeline Migration"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Brief notes about this migration project..."
              />
            </div>
          </CardContent>
        </Card>

        {/* XML Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Upload XML Export</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                dragOver
                  ? "border-blue-500 bg-blue-50"
                  : file
                  ? "border-green-500 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {file ? (
                <>
                  <FileUp className="h-10 w-10 text-green-600 mb-3" />
                  <p className="text-sm font-medium text-green-700">{file.name}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="mt-3 text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 mb-3" />
                  <p className="text-sm text-gray-600">
                    Drag & drop your XML file here, or{" "}
                    <label className="text-blue-600 hover:text-blue-500 cursor-pointer underline">
                      browse
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports Informatica, Talend, DataStage, SSIS, Ab Initio exports
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Target Platform */}
        <Card>
          <CardHeader>
            <CardTitle>Target Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {targetPlatforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => setSelectedTarget(platform.id)}
                  className={`flex flex-col items-start rounded-lg border p-4 text-left transition-colors ${
                    selectedTarget === platform.id
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium text-sm text-gray-900">
                    {platform.name}
                  </span>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {platform.description}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={!projectName || !file || !selectedTarget || loading}
          >
            {loading ? "Creating..." : "Start Conversion"}
            {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
