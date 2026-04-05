import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

const DOCS_ROOT = path.join(process.cwd(), "docs");

/**
 * Load a markdown documentation file for a given source tool.
 * Returns the file content or null if not found.
 */
export function loadSourceToolDoc(tool: string): string | null {
  return loadDoc("source-tools", tool);
}

/**
 * Load a markdown documentation file for a given target platform.
 * Returns the file content or null if not found.
 */
export function loadTargetPlatformDoc(platform: string): string | null {
  return loadDoc("target-platforms", platform);
}

/**
 * Load a mapping guide between a source tool and target platform.
 * Returns the file content or null if not found.
 */
export function loadMappingDoc(sourceTool: string, targetPlatform: string): string | null {
  const slug = `${normalize(sourceTool)}-to-${normalize(targetPlatform)}`;
  return loadDoc("mappings", slug);
}

/**
 * Build a combined documentation context string for AI prompts.
 * Includes source tool docs, target platform docs, and mapping guides when available.
 */
export function buildDocsContext(sourceTool?: string, targetPlatform?: string): string {
  const sections: string[] = [];

  if (sourceTool) {
    const doc = loadSourceToolDoc(sourceTool);
    if (doc) {
      sections.push(`## Source Tool Documentation (${sourceTool})\n${doc}`);
    }
  }

  if (targetPlatform) {
    const doc = loadTargetPlatformDoc(targetPlatform);
    if (doc) {
      sections.push(`## Target Platform Documentation (${targetPlatform})\n${doc}`);
    }
  }

  if (sourceTool && targetPlatform) {
    const doc = loadMappingDoc(sourceTool, targetPlatform);
    if (doc) {
      sections.push(`## Migration Mapping Guide (${sourceTool} → ${targetPlatform})\n${doc}`);
    }
  }

  return sections.length > 0
    ? `\n---\nREFERENCE DOCUMENTATION:\n${sections.join("\n\n")}\n---\n`
    : "";
}

function normalize(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function loadDoc(folder: string, name: string): string | null {
  const filePath = path.join(DOCS_ROOT, folder, `${normalize(name)}.md`);
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      logger.debug("Loaded documentation", { folder, name, chars: content.length });
      return content;
    }
  } catch (err) {
    logger.warn("Failed to load documentation", { folder, name, error: String(err) });
  }
  return null;
}
