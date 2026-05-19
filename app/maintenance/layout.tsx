import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تحت الصيانة | Build Saudi",
  robots: "noindex, nofollow",
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
