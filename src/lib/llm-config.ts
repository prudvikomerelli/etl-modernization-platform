import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export interface LLMConfig {
  model: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

const DEFAULT_CONFIG: LLMConfig = {
  model: "gpt-4o",
  temperature: 0.2,
  topP: 1.0,
  maxTokens: 4096,
};

/**
 * Get LLM configuration for a user. Falls back to defaults if no preference is saved.
 * Never throws — returns defaults on any error.
 */
export async function getLLMConfig(userId?: string): Promise<LLMConfig> {
  if (!userId) return { ...DEFAULT_CONFIG };

  try {
    const pref = await prisma.userLlmPreference.findUnique({
      where: { userId },
    });

    if (!pref) return { ...DEFAULT_CONFIG };

    return {
      model: pref.model,
      temperature: pref.temperature,
      topP: pref.topP,
      maxTokens: pref.maxTokens,
    };
  } catch (err) {
    logger.warn("Failed to load LLM preferences, using defaults", {
      userId,
      error: String(err),
    });
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save or update LLM preferences for a user.
 */
export async function saveLLMConfig(
  userId: string,
  config: Partial<LLMConfig>
): Promise<LLMConfig> {
  const data = {
    model: config.model ?? DEFAULT_CONFIG.model,
    temperature: config.temperature ?? DEFAULT_CONFIG.temperature,
    topP: config.topP ?? DEFAULT_CONFIG.topP,
    maxTokens: config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
  };

  const pref = await prisma.userLlmPreference.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  logger.info("Saved LLM preferences", { userId, ...data });

  return {
    model: pref.model,
    temperature: pref.temperature,
    topP: pref.topP,
    maxTokens: pref.maxTokens,
  };
}

export { DEFAULT_CONFIG };
