/**
 * Local testing script for the parse endpoint.
 * Usage: npx tsx scripts/parse-test.ts <path-to-xml-file>
 */

import { readFileSync } from "fs";
import { resolve } from "path";

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx scripts/parse-test.ts <path-to-xml-file>");
    process.exit(1);
  }

  const absolutePath = resolve(filePath);
  const fileContent = readFileSync(absolutePath);
  const fileName = absolutePath.split("/").pop() || "test.xml";

  const baseUrl = process.env.APP_URL || "http://localhost:3000";

  // Step 1: Detect source
  console.log("🔍 Detecting source ETL tool...");
  const detectForm = new FormData();
  detectForm.append("file", new Blob([fileContent], { type: "text/xml" }), fileName);

  const detectRes = await fetch(`${baseUrl}/api/detect-source`, {
    method: "POST",
    body: detectForm,
  });
  const detectResult = await detectRes.json();
  console.log("Source Detection:", JSON.stringify(detectResult, null, 2));

  // Step 2: Parse
  console.log("\n📋 Parsing XML...");
  const parseForm = new FormData();
  parseForm.append("file", new Blob([fileContent], { type: "text/xml" }), fileName);
  parseForm.append("sourceTool", detectResult.detectedTool);

  const parseRes = await fetch(`${baseUrl}/api/parse`, {
    method: "POST",
    body: parseForm,
  });
  const parseResult = await parseRes.json();
  console.log("Parse Result:", JSON.stringify(parseResult, null, 2));

  console.log("\n✅ Parse test complete.");
}

main().catch(console.error);
