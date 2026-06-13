import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AuraBackground } from "@/components/ui/AuraBackground";
import "./globals.css";

// Body font — modern, consumer-facing, warm personality
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

// Display font — bold editorial headings, striking at large sizes
const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Career OS — Skills-First Hiring in APAC",
  description:
    "Match talent on proven skills, not school names. Built for the next million graduates across Asia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${jakarta.variable} ${syne.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ThemeProvider>
            <AuraBackground />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
