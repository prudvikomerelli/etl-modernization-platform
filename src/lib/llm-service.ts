import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY,
});

export type LLMTask = "detect" | "parse" | "normalize" | "convert";

/**
 * Highly optimized prompts for ETL modernization tasks.
 * Designed for maximum accuracy and strict adherence to schemas.
 */
const PROMPTS: Record<LLMTask, (content: string, context?: any) => string> = {
  detect: (content) => `
    Act as an elite ETL Migration Architect. Your task is to identify the source ETL tool from the provided file snippet.
    
    ANALYSIS GUIDELINES:
    1. Look for XML namespaces (e.g., "talendfile", "DTS").
    2. Identify core object markers (e.g., "POWERMART", "DSJobDefSDO").
    3. Check for tool-specific naming conventions in attributes.
    
    OUTPUT: Return ONLY a JSON object:
    {
      "sourceTool": "informatica" | "talend" | "datastage" | "ssis" | "abinitio" | "unknown",
      "confidence": number (0.0 to 1.0),
      "reasoning": "Brief explanation of why this tool was selected based on signatures found."
    }

    FILE CONTENT:
    ${content.slice(0, 8000)}
  `,

  parse: (content) => `
    Act as a Senior Data Engineer specializing in ETL metadata extraction. 
    Parse the provided source XML/code into a high-fidelity intermediate JSON.
    
    CRITICAL REQUIREMENTS:
    1. Extract ALL Sources and Sinks with their full schema (name, type, precision, scale, nullability).
    2. Map ALL Transformations: Capture the EXACT expression logic. DO NOT mark any transformation as "unsupported". Instead, provide a detailed "logicDescription" for complex types like Router or Java.
    3. Maintain Lineage: Record every connector/link between components (FromField/FromInstance -> ToField/ToInstance).
    4. Data Structure: Return arrays for: "sources", "targets", "transformations", "mappings", "workflows", and "connectors".
    5. Schema Mapping: Ensure every transformation has a "supported": true flag and a "fields" array.

    OUTPUT: Return a structured JSON representing the tool's internal AST.
    
    SOURCE CONTENT (TRUNCATED IF NECESSARY):
    ${content.length > 30000 ? content.slice(0, 15000) + "\\n... [TRUNCATED] ...\\n" + content.slice(-15000) : content}
  `,

  normalize: (_, context) => `
    Act as a Principal Data Architect. Map the tool-specific metadata JSON into our standard "Canonical Data Model".
    
    CANONICAL SCHEMA RULES:
    - "sources"/"sinks": Unique IDs (src-1, tgt-1), standardized data types (string, integer, decimal, datetime, boolean).
    - "transformations": Standardize types to (expression, filter, joiner, aggregator, lookup, router, union, sorter).
    - "logic": Store mapping expressions in a "logic.expressions" map where key=output_field and value=expression_logic.
    - "orchestration": Extract the execution graph (tasks and dependencies).
    
    INPUT METADATA:
    ${JSON.stringify(context?.parsedData)}
    
    TARGET: Return a JSON object matching the "CanonicalPipeline" interface.
  `,

  convert: (_, context) => `
    Act as a DevOps and Data Platform Expert. Convert the Canonical Data Model into production-grade ${context?.targetPlatform} code.
    
    ENGINEERING STANDARDS:
    1. IDEMPOTENCY: Ensure the generated code (e.g., Airflow DAG, ADF JSON) is idempotent.
    2. BEST PRACTICES: Use native operators/activities where possible (e.g., copy activities for simple movement, DataFlow for complex logic).
    3. PARAMETERIZATION: Map all canonical parameters to the target platform's native parameter system.
    4. ERROR HANDLING: Include basic retry logic and logging as per ${context?.targetPlatform} standards.

    CANONICAL MODEL:
    ${JSON.stringify(context?.canonical)}
    
    OUTPUT: Return the code/config as a JSON object with a "code" field (string) and "files" array for multi-file configurations.
  `
};

export async function callLLM(task: LLMTask, content: string, context?: any) {
  const prompt = PROMPTS[task](content, context);

  const response = await openai.chat.completions.create({
    model: task === "detect" ? "gpt-3.5-turbo" : "gpt-4o",
    messages: [
      { 
        role: "system", 
        content: "You are a specialized ETL modernization engine. You produce perfect, production-ready outputs. You MUST return valid JSON." 
      },
      { role: "user", content: prompt }
    ],
    response_format: { type: "json_object" }
  });

  const result = JSON.parse(response.choices[0].message.content || "{}");
  console.log(`LLM Task [${task}] completed.`);
  return result;
}
