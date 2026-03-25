import { NextRequest, NextResponse } from "next/server";
import { ValidationResult } from "@/types";

const UNSUPPORTED_TRANSFORMS: Record<string, string[]> = {
  airflow: ["Router", "Normalizer", "Java"],
  "azure-data-factory": ["Router", "CustomTransformation", "Java"],
  databricks: ["Router", "Normalizer"],
  dagster: ["Router", "Normalizer", "StoredProcedure"],
  prefect: ["Router", "Normalizer"],
  "aws-glue": ["Router", "Normalizer", "StoredProcedure"],
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canonical, targetPlatform } = body;

    if (!canonical || !targetPlatform) {
      return NextResponse.json(
        { error: "canonical and targetPlatform are required" },
        { status: 400 }
      );
    }

    const unsupported = UNSUPPORTED_TRANSFORMS[targetPlatform] || [];
    const transformations = canonical.transformations || [];
    const errors: ValidationResult["errors"] = [];
    const warnings: ValidationResult["warnings"] = [];
    const suggestions: ValidationResult["suggestions"] = [];

    let mappedCount = 0;

    for (const tx of transformations) {
      if (unsupported.some((u: string) => tx.type?.toLowerCase() === u.toLowerCase())) {
        warnings.push({
          code: "UNSUPPORTED_TRANSFORM",
          message: `Transformation '${tx.name}' (${tx.type}) has no direct equivalent in ${targetPlatform}.`,
          severity: "warning",
          path: `transformations.${tx.id}`,
          suggestion: `Implement custom logic or use a generic operator to replicate ${tx.type} behavior.`,
        });
      } else {
        mappedCount++;
      }
    }

    if (!canonical.metadata?.name) {
      errors.push({
        code: "MISSING_NAME",
        message: "Pipeline name is required in canonical model metadata.",
        severity: "error",
        path: "metadata.name",
      });
    }

    if (transformations.length > 0 && mappedCount === transformations.length) {
      suggestions.push({
        code: "FULL_COVERAGE",
        message: "All transformations have direct mappings. Consider reviewing for optimization opportunities.",
        severity: "info",
      });
    }

    const total = transformations.length || 1;
    const percentage = Math.round((mappedCount / total) * 100);

    const result: ValidationResult = {
      valid: errors.length === 0,
      score: percentage,
      errors,
      warnings,
      suggestions,
      coverage: {
        mappedTransformations: mappedCount,
        totalTransformations: transformations.length,
        percentage,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
