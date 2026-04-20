export const dynamic = "force-dynamic";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/auth/admin";
import { InviteUserForm } from "./invite-user-form";
import { DeleteUserButton } from "./delete-user-button";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const isAdmin = await isUserAdmin(user.id);
  if (!isAdmin) redirect("/");

  const adminSupabase = createServiceRoleClient();
  const { data: { users } } = await adminSupabase.auth.admin.listUsers();

  const sorted = [...(users ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1D3F1F]">المستخدمون</h1>
        <p className="mt-1 text-sm text-[#1D3F1F]/55">إدارة حسابات الوصول للداشبورد</p>
      </div>

      <div className="mb-6">
        <InviteUserForm />
      </div>

      <div className="overflow-hidden rounded-[16px] border border-[#1D3F1F]/10 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1D3F1F]/10 bg-[#F4F3EB]/60 text-right text-xs font-semibold text-[#1D3F1F]/50">
              <th className="px-4 py-3">البريد الإلكتروني</th>
              <th className="px-4 py-3">آخر تسجيل دخول</th>
              <th className="px-4 py-3">تاريخ الإنشاء</th>
              <th className="px-4 py-3">الحالة</th>
              <th className="px-4 py-3">إجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1D3F1F]/[0.06]">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#1D3F1F]/40">لا يوجد مستخدمون</td>
              </tr>
            ) : (
              sorted.map((u) => (
                <tr key={u.id} className="hover:bg-[#F4F3EB]/40">
                  <td className="px-4 py-3 font-medium text-[#1D3F1F]" dir="ltr">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-[#1D3F1F]/50" dir="ltr">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("ar-SA") : "لم يسجل دخول"}
                  </td>
                  <td className="px-4 py-3 text-[#1D3F1F]/50" dir="ltr">
                    {new Date(u.created_at).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-4 py-3">
                    {u.email_confirmed_at ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">مفعّل</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">دعوة مرسلة</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DeleteUserButton userId={u.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}