"use client";

import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

interface StepCardProps {
  step: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  durationMs: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

const STEP_LABELS: Record<string, string> = {
  upload: "Upload XML",
  detect: "Detect Source Tool",
  parse: "Parse Metadata",
  normalize: "Normalize to Canonical",
  convert: "Convert to Target",
  validate: "Validate Output",
  export: "Export Artifacts",
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "COMPLETED":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "FAILED":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "RUNNING":
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function StepCard({ step, status, durationMs, errorMessage, startedAt, completedAt }: StepCardProps) {
  const label = STEP_LABELS[step] || step;
  const time = completedAt
    ? new Date(completedAt).toLocaleTimeString()
    : new Date(startedAt).toLocaleTimeString();

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 ${
        status === "FAILED"
          ? "border-red-200 bg-red-50"
          : status === "COMPLETED"
          ? "border-green-200 bg-green-50"
          : "border-blue-200 bg-blue-50"
      }`}
    >
      <div className="mt-0.5">
        <StatusIcon status={status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <span className="text-xs text-gray-500">{formatDuration(durationMs)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{time}</p>
        {errorMessage && (
          <p className="text-xs text-red-600 mt-1 truncate" title={errorMessage}>
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
