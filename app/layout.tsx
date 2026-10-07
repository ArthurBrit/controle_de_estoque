import type { Metadata } from "next";
import "./globals.css";
import "./motion.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = { title: "Controle de Cestas", description: "Gestão local de estoque de cestas" };
export default function RootLayout({children}:{children:React.ReactNode}){ return <html lang="pt-BR"><body><AppShell>{children}</AppShell></body></html>; }
