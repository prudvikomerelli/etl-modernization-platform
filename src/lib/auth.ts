import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function getSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getOrCreateDbUser() {
  const authUser = await requireAuth();

  let dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: authUser.id },
    include: { subscription: true },
  });

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: authUser.email!,
        name: authUser.user_metadata?.full_name || null,
        supabaseUserId: authUser.id,
        subscription: {
          create: {
            plan: "FREE",
            status: "ACTIVE",
          },
        },
      },
      include: { subscription: true },
    });
  }

  return dbUser;
}
