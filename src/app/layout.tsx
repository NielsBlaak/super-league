import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Header from "@/components/Header";
import LocalModeNotice from "@/components/LocalModeNotice";
import { ResultsProvider } from "@/contexts/ResultsContext";
import "./globals.css";
import styles from "./layout.module.css";

// One family with a width axis: condensed for names and scores, normal for text.
// latin-ext is necessary for player names such as Szczęsny and Çalhanoğlu.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Super League", template: "%s – Super League" },
  description: "De stand, het speelschema en de topscorers van de Super League.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#12261d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="nl" className={archivo.variable}>
      <body>
        <ResultsProvider>
          <Header />
          <main className={styles.main}>
            {children}
            <LocalModeNotice />
          </main>
        </ResultsProvider>
      </body>
    </html>
  );
}
