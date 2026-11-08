import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { ServiceWorker } from "@/components/ServiceWorker";

export const metadata: Metadata = {
  title: {
    default: "Simulador TJSP Escrevente 2027",
    template: "%s · Simulador TJSP Escrevente",
  },
  description:
    "Simulados com questões oficiais da VUNESP para o concurso de Escrevente Técnico Judiciário do TJSP. Prova de 14/03/2027.",
  manifest: "/manifest.webmanifest",
  applicationName: "Simulador TJSP Escrevente",
  appleWebApp: { capable: true, title: "TJSP Escrevente", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#163664",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">{children}</main>
        <footer className="border-t border-ink-100 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-ink-500 sm:px-6">
            <p>
              Projeto independente de estudo. Não tem vínculo com o TJSP nem com a Fundação
              VUNESP. Questões e gabaritos pertencem aos respectivos titulares e são usados
              aqui para fins educacionais, com atribuição da fonte.
            </p>
            <p>
              Dados da prova: VUNESP TJSP2503 (aplicada em 07/12/2025) e edital TJSP2607
              (prova em 14/03/2027). Estimativas não garantem aprovação.
            </p>
          </div>
        </footer>
        <ServiceWorker />
      </body>
    </html>
  );
}
