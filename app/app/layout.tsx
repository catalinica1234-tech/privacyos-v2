import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Aplicación",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
