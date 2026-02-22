import { Metadata } from "next";

import { DashboardView } from "@/components/dashboard/dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Build customer dashboard"
};

export default function DashboardPage() {
  return <DashboardView />;
}
