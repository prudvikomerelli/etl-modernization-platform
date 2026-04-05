"use client";

import { useEffect, useState } from "react";
import StepCard from "./step-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ConversionStep {
  id: string;
  step: string;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  durationMs: number | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface ConversionTimelineProps {
  projectId: string;
}

export default function ConversionTimeline({ projectId }: ConversionTimelineProps) {
  const [steps, setSteps] = useState<ConversionStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSteps() {
      try {
        const res = await fetch(`/api/project-steps?projectId=${projectId}`);
        if (res.ok) {
          const data = await res.json();
          setSteps(data.steps || []);
        }
      } catch {
        // Non-fatal — timeline just won't show
      } finally {
        setLoading(false);
      }
    }
    fetchSteps();
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Conversion Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading steps...</p>
        </CardContent>
      </Card>
    );
  }

  if (steps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" /> Conversion Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No conversion steps recorded yet. Steps will appear here as you process the pipeline.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" /> Conversion Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {steps.map((step) => (
            <StepCard
              key={step.id}
              step={step.step}
              status={step.status}
              durationMs={step.durationMs}
              errorMessage={step.errorMessage}
              startedAt={step.startedAt}
              completedAt={step.completedAt}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
