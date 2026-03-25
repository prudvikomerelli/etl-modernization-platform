/**
 * Local testing script for the full conversion pipeline.
 * Usage: npx tsx scripts/convert-test.ts <path-to-xml-file> [target-platform]
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join } from "path";

async function main() {
  const filePath = process.argv[2];
  const targetPlatform = process.argv[3] || "airflow";

  if (!filePath) {
    console.error("Usage: npx tsx scripts/convert-test.ts <path-to-xml-file> [target-platform]");
    console.error("Targets: airflow, azure-data-factory, databricks, dagster, prefect, aws-glue");
    process.exit(1);
  }

  const absolutePath = resolve(filePath);
  const fileContent = readFileSync(absolutePath);
  const fileName = absolutePath.split("/").pop() || "test.xml";
  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  // Step 1: Detect source
  console.log("🔍 Step 1: Detecting source...");
  const detectForm = new FormData();
  detectForm.append("file", new Blob([fileContent], { type: "text/xml" }), fileName);
  const detectRes = await fetch(`${baseUrl}/api/detect-source`, { method: "POST", body: detectForm });
  const detectResult = await detectRes.json();
  console.log(`   Detected: ${detectResult.detectedTool} (confidence: ${detectResult.confidence})`);

  // Step 2: Parse
  console.log("📋 Step 2: Parsing XML...");
  const parseForm = new FormData();
  parseForm.append("file", new Blob([fileContent], { type: "text/xml" }), fileName);
  parseForm.append("sourceTool", detectResult.detectedTool);
  const parseRes = await fetch(`${baseUrl}/api/parse`, { method: "POST", body: parseForm });
  const parseResult = await parseRes.json();
  console.log(`   Found: ${parseResult.mappings?.length || 0} mappings, ${parseResult.transformations?.length || 0} transformations`);

  // Step 3: Normalize
  console.log("🔄 Step 3: Normalizing to canonical model...");
  const normalizeRes = await fetch(`${baseUrl}/api/normalize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parsedData: parseResult, sourceTool: detectResult.detectedTool, projectName: "CLI Test" }),
  });
  const canonical = await normalizeRes.json();
  console.log(`   Canonical model v${canonical.version} generated`);

  // Step 4: Convert
  console.log(`⚡ Step 4: Converting to ${targetPlatform}...`);
  const convertRes = await fetch(`${baseUrl}/api/convert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ canonical, targetPlatform }),
  });
  const convertResult = await convertRes.json();

  // Step 5: Validate
  console.log("✅ Step 5: Validating...");
  const validateRes = await fetch(`${baseUrl}/api/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ canonical, targetPlatform }),
  });
  const validation = await validateRes.json();
  console.log(`   Score: ${validation.score}% | Warnings: ${validation.warnings?.length || 0} | Errors: ${validation.errors?.length || 0}`);

  // Save outputs
  const outputDir = resolve("outputs");
  mkdirSync(outputDir, { recursive: true });

  writeFileSync(join(outputDir, "canonical.json"), JSON.stringify(canonical, null, 2));
  writeFileSync(join(outputDir, `${targetPlatform}_output.json`), JSON.stringify(convertResult, null, 2));
  writeFileSync(join(outputDir, "validation.json"), JSON.stringify(validation, null, 2));

  console.log(`\n📁 Outputs saved to ./outputs/`);
  console.log("🎉 Conversion test complete!");
}

main().catch(console.error);
