"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Clock, FileSearch } from "lucide-react";

interface ArtifactInfo {
  id: string;
  detectedSourceTool: string | null;
  createdAt: string;
}

interface ArtifactSelectorProps {
  artifacts: ArtifactInfo[];
  selectedId: string;
}

export default function ArtifactSelector({ artifacts, selectedId }: ArtifactSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (artifacts.length <= 1) return null;

  const handleSelect = (artifactId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("artifactId", artifactId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Parse History ({artifacts.length} runs)</p>
      <div className="flex gap-2 flex-wrap">
        {artifacts.map((artifact, index) => (
          <button
            key={artifact.id}
            onClick={() => handleSelect(artifact.id)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              selectedId === artifact.id
                ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500 text-blue-700"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
            }`}
          >
            <FileSearch className="h-3.5 w-3.5" />
            <span className="font-medium">Run #{artifacts.length - index}</span>
            {artifact.detectedSourceTool && (
              <span className="text-xs opacity-70 capitalize">({artifact.detectedSourceTool})</span>
            )}
            <span className="text-xs opacity-50 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {new Date(artifact.createdAt).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
