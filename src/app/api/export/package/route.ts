import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { canonical, targetOutput, validation, targetPlatform } = body;

    if (!canonical || !targetOutput) {
      return NextResponse.json(
        { error: "canonical and targetOutput are required" },
        { status: 400 }
      );
    }

    // Bundle all artifacts into a single JSON package
    const packageData = {
      exportedAt: new Date().toISOString(),
      platform: targetPlatform,
      artifacts: {
        canonical,
        targetOutput,
        validation: validation || null,
      },
      readme: `# ETL Conversion Package\n\nTarget: ${targetPlatform}\nExported: ${new Date().toISOString()}\n\n## Contents\n- canonical.json: Platform-neutral pipeline model\n- output.json: Target platform configuration\n- validation.json: Conversion validation report`,
    };

    const jsonString = JSON.stringify(packageData, null, 2);

    return new NextResponse(jsonString, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="etl_package_${targetPlatform}_${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error("Package export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
