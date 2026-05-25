import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Manrope, Syne } from "next/font/google";
import { SiteMotionProvider } from "@/components/motion/SiteMotionProvider";
import { ThemeScope } from "@/components/motion/ThemeScope";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["700", "800"],
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SRS · 自控力协议",
  description: "CTDP and RSIP self-regulation protocols",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${syne.variable} ${manrope.variable} ${jetbrains.variable}`}>
        <ThemeProvider>
          <ThemeScope>
            <SiteMotionProvider>{children}</SiteMotionProvider>
          </ThemeScope>
        </ThemeProvider>
      </body>
    </html>
  );
}
