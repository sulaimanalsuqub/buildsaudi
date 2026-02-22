import { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "لوحة التحكم",
  description: "لوحة تحكم العملاء في بيلد"
};

export default function ArabicDashboardPage() {
  return <DashboardView isRtl />;
}
