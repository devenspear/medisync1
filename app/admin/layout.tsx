import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin - StillCaster",
  description: "Voice synthesis experimentation and admin controls",
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
