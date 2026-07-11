import type { Metadata } from "next";
import { Inter, Outfit, Comfortaa, Instrument_Sans, Plus_Jakarta_Sans, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrumentsans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plusjakartasans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-firacode",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Clausely.ai | Legal Operating System",
  description: "Next-generation autonomous legal drafting and compliance for the Indian legal domain.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${comfortaa.variable} ${instrumentSans.variable} ${plusJakartaSans.variable} ${firaCode.variable}`}>
        {children}
      </body>
    </html>
  );
}
