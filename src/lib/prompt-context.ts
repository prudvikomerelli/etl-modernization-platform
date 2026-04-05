import { buildDocsContext } from "@/lib/docs-loader";

/**
 * Build an enhanced prompt context object that includes documentation.
 * Merges existing context with relevant docs so the LLM has better reference material.
 */
export function enrichPromptContext(
  task: string,
  context?: Record<string, unknown>
): Record<string, unknown> {
  const enriched = { ...context };

  const sourceTool = (context?.sourceTool as string) || undefined;
  const targetPlatform = (context?.targetPlatform as string) || undefined;

  // Only attach docs for tasks that benefit from documentation context
  if (task === "parse" || task === "normalize" || task === "convert") {
    const docsContext = buildDocsContext(sourceTool, targetPlatform);
    if (docsContext) {
      enriched._docsContext = docsContext;
    }
  }

  return enriched;
}
