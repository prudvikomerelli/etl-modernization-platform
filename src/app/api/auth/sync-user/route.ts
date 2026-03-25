import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Upsert: create if not exists, return existing if already there
    const dbUser = await prisma.user.upsert({
      where: { supabaseUserId: user.id },
      update: {
        email: user.email!,
        name: user.user_metadata?.full_name || undefined,
      },
      create: {
        email: user.email!,
        name: user.user_metadata?.full_name || null,
        supabaseUserId: user.id,
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
          },
        },
      },
      include: { subscription: true },
    });

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("User sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync user" },
      { status: 500 }
    );
  }
}
