"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileUp, CheckCircle, Loader2, RefreshCw, FileText } from "lucide-react";

interface SourceFileInfo {
  id: string;
  filename: string;
  fileSizeBytes: number;
  createdAt: string;
}

export default function UploadPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [useLLM, setUseLLM] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [detectedSource, setDetectedSource] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [existingFiles, setExistingFiles] = useState<SourceFileInfo[]>([]);
  const [showReupload, setShowReupload] = useState(false);

  // Check for existing uploads on mount
  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          const { project } = await res.json();
          if (project.sourceFiles && project.sourceFiles.length > 0) {
            setExistingFiles(project.sourceFiles);
            setUploaded(true);
            setDetectedSource(project.sourceTool || null);
          }
        }
      } catch {
        // Non-fatal — just show upload form
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [params.id]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.toLowerCase().endsWith(".xml")) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const content = await file.text();

      const [detectRes, parseRes] = await Promise.all([
        fetch(`/api/detect-source?llm=${useLLM}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, filename: file.name }),
        }),
        fetch(`/api/parse?llm=${useLLM}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content,
            filename: file.name,
            projectId: params.id,
            fileSize: file.size,
          }),
        })
      ]);

      if (!detectRes.ok) throw new Error("Source detection failed");
      if (!parseRes.ok) throw new Error("Parsing failed");

      const detectData = await detectRes.json();
      setDetectedSource(detectData.sourceTool || "unknown");
      setUploaded(true);
      setShowReupload(false);
      setExistingFiles([{
        id: "new",
        filename: file.name,
        fileSizeBytes: file.size,
        createdAt: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading project...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload XML Export</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your legacy ETL pipeline export file for analysis.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {/* Show existing upload info */}
      {uploaded && !showReupload && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Uploaded Files</span>
                <Badge variant="success">{existingFiles.length} file{existingFiles.length !== 1 ? "s" : ""}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {existingFiles.map((sf) => (
                  <div key={sf.id} className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{sf.filename}</p>
                      <p className="text-xs text-green-600">
                        {(Number(sf.fileSizeBytes) / 1024).toFixed(1)} KB • Uploaded {new Date(sf.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {detectedSource && (
            <Card>
              <CardHeader>
                <CardTitle>Source Detection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 rounded-lg bg-green-50 border border-green-200 p-4">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Detected: <span className="capitalize">{detectedSource}</span>
                    </p>
                    <p className="text-xs text-green-600 mt-0.5">
                      ETL tool identified based on XML structure signatures.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/app/project/${params.id}`)}
              >
                Back to Project
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowReupload(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Upload New File
              </Button>
            </div>
            <Button onClick={() => router.push(`/app/project/${params.id}/parse`)}>
              Continue to Parse →
            </Button>
          </div>
        </>
      )}

      {/* Upload form (shown when no existing files or re-uploading) */}
      {(!uploaded || showReupload) && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>XML Source File</CardTitle>
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
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                  dragOver
                    ? "border-blue-500 bg-blue-50"
                    : file
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                {file ? (
                  <>
                    <FileUp className="h-10 w-10 text-blue-600 mb-3" />
                    <p className="text-sm font-medium text-blue-700">{file.name}</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {(file.size / 1024).toFixed(1)} KB — Ready to upload
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

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (showReupload) {
                  setShowReupload(false);
                } else {
                  router.push(`/app/project/${params.id}`);
                }
              }}
            >
              {showReupload ? "Cancel" : "Back to Project"}
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading & Analyzing...
                </>
              ) : (
                "Upload & Detect Source"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
