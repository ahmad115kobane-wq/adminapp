import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import DashboardLayout from "@/components/layout/DashboardLayout";

const cairo = Cairo({ subsets: ["arabic", "latin"] });

export const metadata: Metadata = {
  title: "لوحة تحكم AppSport",
  description: "لوحة إدارة تطبيق AppSport",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className={`${cairo.className} antialiased bg-gray-950 text-white`}>
        <Providers>
          <DashboardLayout>{children}</DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}
