import { createServerClient } from "@/lib/supabase/server";

export type AdminRole = "admin" | "moderator" | "viewer";

export async function isUserAdmin(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("is_active")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) return false;
    return true;
  } catch {
    return false;
  }
}

export async function getUserRole(userId: string | undefined): Promise<AdminRole | null> {
  if (!userId) return null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", userId)
      .eq("is_active", true)
      .single();

    if (error || !data) return null;
    return (data.role as AdminRole) || null;
  } catch {
    return null;
  }
}

export async function requireAdminRole(userId: string | undefined): Promise<boolean> {
  const isAdmin = await isUserAdmin(userId);
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
  return true;
}

export async function checkAdminPermission(userId: string | undefined, requiredRole: AdminRole = "admin"): Promise<boolean> {
  const userRole = await getUserRole(userId);
  if (!userRole) return false;

  const roleHierarchy = { admin: 3, moderator: 2, viewer: 1 };
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
