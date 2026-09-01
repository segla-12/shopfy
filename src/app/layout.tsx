import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { FavoritesProvider } from "@/lib/favorites";
import { LanguageProvider } from "@/lib/language";
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
  title: {
    default: "Shopfy",
    template: "%s | Shopfy",
  },
  description:
    "Shopfy is a modern marketplace connecting buyers with trusted wholesale suppliers and storefronts.",
  applicationName: "Shopfy",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "https://shopfy.site",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shopfy.site",
    siteName: "Shopfy",
    title: "Shopfy",
    description:
      "Shopfy is a modern marketplace connecting buyers with trusted wholesale suppliers and storefronts.",
    images: [
      {
        url: "https://shopfy.site/shopfy-logo-clean.png",
        width: 1200,
        height: 420,
        alt: "Shopfy official logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@shopfy",
    title: "Shopfy",
    description:
      "Shopfy is a modern marketplace connecting buyers with trusted wholesale suppliers and storefronts.",
    images: ["https://shopfy.site/shopfy-logo-clean.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/shopfy-favicon-clean.png", type: "image/png", sizes: "512x512" },
      { url: "/shopfy-favicon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon-clean.png",
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
              <SafetyNoticeModal />
              {children}
            </FavoritesProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
