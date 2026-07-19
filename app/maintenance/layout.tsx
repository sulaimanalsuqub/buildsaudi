import type { Metadata } from "next";

import "../globals.css";

export const metadata: Metadata = {
  title: "تحت الصيانة | Build Saudi",
  robots: "noindex, nofollow",
};

export default function MaintenanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
