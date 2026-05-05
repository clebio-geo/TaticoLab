import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3, Boxes, Calculator, Cog, Home, Package, Printer, ReceiptText } from "lucide-react";
import "./globals.css";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tatico LAB 3D",
  description: "Gestao de custos, produtos e vendas para impressao 3D.",
};

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/printers", label: "Impressoras", icon: Printer },
  { href: "/materials", label: "Materiais", icon: Boxes },
  { href: "/products", label: "Produtos", icon: Package },
  { href: "/sales", label: "Vendas", icon: ReceiptText },
  { href: "/reports", label: "Relatorios", icon: BarChart3 },
  { href: "/settings", label: "Configuracoes", icon: Cog },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
          <aside className="border-b bg-card lg:min-h-screen lg:border-b-0 lg:border-r">
            <div className="flex h-16 items-center gap-2 px-5">
              <Calculator className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">Tatico LAB 3D</div>
                <div className="text-xs text-muted-foreground">Gestao de impressao</div>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:grid lg:overflow-visible">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex min-w-fit items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
