import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { AgreeButton } from "./agree-button";

export default async function VendorSignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  // Fetch signature record by token
  const { data: sig } = await supabase
    .from("vendor_contract_signatures")
    .select("*, contracts(*), vendors(establishment_name, manager_name)")
    .eq("token", token)
    .single();

  if (!sig) notFound();

  const contract = sig.contracts as {
    id: string;
    title: string;
    file_url: string;
  } | null;

  const vendor = sig.vendors as {
    establishment_name: string;
    manager_name: string;
  } | null;

  const alreadySigned = !!sig.signed_at;

  return (
    <div className="min-h-screen bg-[#F4F3EB]" dir="rtl">
      {/* Header */}
      <header className="border-b border-[#1D3F1F]/10 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-ar.svg" alt="Build" className="h-7 w-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {alreadySigned ? (
          /* Already signed */
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-8 text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h1 className="text-xl font-bold text-emerald-800">تم التوقيع على العقد</h1>
            <p className="mt-2 text-sm text-emerald-700">
              وقّعت على هذا العقد بتاريخ{" "}
              {new Date(sig.signed_at!).toLocaleDateString("ar-SA", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        ) : (
          <>
            {/* Greeting */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#1D3F1F]">
                مرحباً، {vendor?.establishment_name ?? ""}
              </h1>
              <p className="mt-1 text-sm text-[#1D3F1F]/60">
                يرجى قراءة العقد أدناه والموافقة عليه للمتابعة كمورد معتمد لدى Build
              </p>
            </div>

            {/* Contract viewer */}
            <div className="mb-6 overflow-hidden rounded-[16px] border border-[#1D3F1F]/10 bg-white">
              <div className="border-b border-[#1D3F1F]/10 px-5 py-3">
                <h2 className="font-semibold text-[#1D3F1F]">{contract?.title}</h2>
              </div>

              {/* PDF embed */}
              <div className="h-[520px] w-full">
                <iframe
                  src={`${contract?.file_url}#toolbar=0`}
                  className="h-full w-full"
                  title="عقد المورد"
                />
              </div>

              {/* Download link */}
              <div className="border-t border-[#1D3F1F]/10 px-5 py-3">
                <a
                  href={contract?.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#09B14B] hover:underline"
                >
                  📄 تحميل العقد
                </a>
              </div>
            </div>

            {/* Agree section */}
            <div className="rounded-[16px] border border-[#1D3F1F]/10 bg-white p-6">
              <p className="mb-4 text-sm text-[#1D3F1F]/70">
                بالضغط على زر الموافقة أدناه، أقرّ أنا{" "}
                <span className="font-semibold text-[#1D3F1F]">
                  {vendor?.manager_name ?? ""}
                </span>{" "}
                بأنني اطّلعت على جميع بنود العقد وأوافق عليها باسم منشأة{" "}
                <span className="font-semibold text-[#1D3F1F]">
                  {vendor?.establishment_name ?? ""}
                </span>
                .
              </p>
              <AgreeButton token={token} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
