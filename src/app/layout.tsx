import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { FavoritesProvider } from "@/lib/favorites";
import { LanguageProvider } from "@/lib/language";
import { NavbarModeProvider } from "@/lib/navbarMode";
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_COOKIE_KEY } from "@/lib/languageConfig";
import { ThemeProvider } from "@/lib/theme";
import { SafetyNoticeModal } from "@/ui/SafetyNoticeModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shopfy.site"),
  title: "Shopfy - Modern marketplace",
  description: "Buy and sell easily with Shopfy.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/favicon-shopfy.ico", type: "image/x-icon", sizes: "any" },
      { url: "/shopfy-favicon-clean.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: ["/favicon.ico", "/favicon-shopfy.ico"],
    apple: "/apple-touch-icon-clean.png",
  },
  alternates: {
    canonical: "/",
  },
  other: {
    google: "notranslate",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const languageCookie = (await cookies()).get(LANGUAGE_COOKIE_KEY)?.value;
  const initialLanguage = isLanguage(languageCookie) ? languageCookie : DEFAULT_LANGUAGE;

  return (
    <html
      lang={initialLanguage}
      translate="no"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} notranslate h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" translate="no">
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLanguage}>
            <FavoritesProvider>
              <NavbarModeProvider>
              <SafetyNoticeModal />
              {children}
              </NavbarModeProvider>
            </FavoritesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
