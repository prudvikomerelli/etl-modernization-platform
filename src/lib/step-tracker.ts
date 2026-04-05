import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type PipelineStep =
  | "upload"
  | "detect"
  | "parse"
  | "normalize"
  | "convert"
  | "validate"
  | "export";

interface StepHandle {
  id: string;
  startTime: number;
}

/**
 * Start tracking a conversion step. Returns a handle used to complete or fail it.
 * All operations are non-fatal — errors are logged but never thrown.
 */
export async function startStep(
  projectId: string,
  step: PipelineStep,
  input?: Record<string, unknown>
): Promise<StepHandle | null> {
  try {
    const record = await prisma.conversionStep.create({
      data: {
        projectId,
        step,
        status: "RUNNING",
        input: input ? JSON.parse(JSON.stringify(input)) : undefined,
      },
    });
    logger.step(step, "started", { projectId, stepId: record.id });
    return { id: record.id, startTime: Date.now() };
  } catch (err) {
    logger.error("Failed to start step tracking", { projectId, step, error: String(err) });
    return null;
  }
}

/**
 * Mark a step as completed with optional output data.
 */
export async function completeStep(
  handle: StepHandle | null,
  output?: Record<string, unknown>
): Promise<void> {
  if (!handle) return;
  try {
    const durationMs = Date.now() - handle.startTime;
    await prisma.conversionStep.update({
      where: { id: handle.id },
      data: {
        status: "COMPLETED",
        output: output ? JSON.parse(JSON.stringify(output)) : undefined,
        durationMs,
        completedAt: new Date(),
      },
    });
    logger.step("step", "completed", { stepId: handle.id, durationMs });
  } catch (err) {
    logger.error("Failed to complete step tracking", { stepId: handle.id, error: String(err) });
  }
}

/**
 * Mark a step as failed with an error message.
 */
export async function failStep(
  handle: StepHandle | null,
  errorMessage: string
): Promise<void> {
  if (!handle) return;
  try {
    const durationMs = Date.now() - handle.startTime;
    await prisma.conversionStep.update({
      where: { id: handle.id },
      data: {
        status: "FAILED",
        errorMessage,
        durationMs,
        completedAt: new Date(),
      },
    });
    logger.step("step", "failed", { stepId: handle.id, durationMs, errorMessage });
  } catch (err) {
    logger.error("Failed to record step failure", { stepId: handle.id, error: String(err) });
  }
}
