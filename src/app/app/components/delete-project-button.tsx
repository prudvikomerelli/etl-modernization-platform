"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

interface DeleteProjectButtonProps {
  projectId: string;
  projectName: string;
}

export default function DeleteProjectButton({ projectId, projectName }: DeleteProjectButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
      }
    } catch {
      alert("Failed to delete project");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  if (showConfirm) {
    return (
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.preventDefault()}
      >
        <span className="text-xs text-red-600 font-medium">Delete &quot;{projectName}&quot;?</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDelete();
          }}
          disabled={deleting}
          className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {deleting ? "Deleting…" : "Confirm"}
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowConfirm(false);
          }}
          className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(true);
      }}
      className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
      title="Delete project"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
