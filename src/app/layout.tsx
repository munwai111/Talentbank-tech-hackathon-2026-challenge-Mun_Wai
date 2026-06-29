import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Syne, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { AuraBackground } from "@/components/ui/AuraBackground";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
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

// Landing display font — geometric character for the public marketing front door
const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Technical/mono accent — system readouts, eyebrows, salary figures
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Y.O.U — Your Odyssey Vector",
  description:
    "The YOU beyond resume. Y.O.U reads your real skills and plots the routes only you could take — skills-first careers for the next million graduates across Asia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      // Pin auth routes in code so the live deployment always uses the in-app
      // /sign-in and /sign-up pages instead of falling back to Clerk's hosted
      // Account Portal (*.clerk.accounts.dev) when the NEXT_PUBLIC_CLERK_* env
      // vars aren't set on the host. Keeps auth working on any public server.
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en" className={`${jakarta.variable} ${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} h-full antialiased`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <ThemeProvider>
            <LanguageProvider>
              <AuraBackground />
              {children}
            </LanguageProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
