import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://shopfy.site"),
  title: {
    default: "Shopfy | Votre boutique en ligne",
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
    title: "Shopfy | Votre boutique en ligne",
    description:
      "Shopfy is a modern marketplace connecting buyers with trusted wholesale suppliers and storefronts.",
    images: [
      {
        url: "/shopfy-logo-clean.png",
        type: "image/png",
        width: 640,
        height: 210,
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
    images: [{ url: "/shopfy-logo-clean.png", alt: "Logo officiel Shopfy" }],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/shopfy-favicon-clean.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon-clean.png",
  },
  other: {
    google: "notranslate",
  },
};

const shopfyStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://shopfy.site/#organization",
      name: "Shopfy",
      url: "https://shopfy.site/",
      description: metadata.description,
      logo: {
        "@type": "ImageObject",
        url: "https://shopfy.site/shopfy-favicon-clean.png",
        width: 512,
        height: 512,
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://shopfy.site/#website",
      name: "Shopfy",
      url: "https://shopfy.site/",
      publisher: { "@id": "https://shopfy.site/#organization" },
    },
  ],
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
      className={`${geistSans.variable} notranslate h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" translate="no">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(shopfyStructuredData).replace(/</g, "\\u003c") }}
        />
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
