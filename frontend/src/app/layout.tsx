import type { Metadata } from "next";
import { Archivo, IBM_Plex_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RELAY // Organizational Continuity, Engineered",
  description:
    "Industrial agentic platform preserving institutional memory, tracking operational obligations, and synthesizing verified handovers.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${ibmPlexSans.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full bg-raw-paper text-carbon font-sans antialiased selection:bg-signal-orange selection:text-raw-paper">
        {children}
      </body>
    </html>
  );
}
