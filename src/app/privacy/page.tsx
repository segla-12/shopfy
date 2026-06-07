import type { Metadata } from "next";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy - Shopfy",
  description: "Shopfy privacy policy and data handling practices.",
  alternates: {
    canonical: "/privacy",
  },
};

const sections = [
  {
    title: "1. Information we collect",
    body: [
      "Shopfy may collect account information such as your name, email address, profile image, phone number, business name, store profile, product listings, product photos, delivery information, city, country, and optional location coordinates when you provide them.",
      "If you sign in with Google, Shopfy uses the basic Google account information you authorize, such as your name, email address, and profile image, only to create, secure, and manage your Shopfy account.",
    ],
  },
  {
    title: "2. How we use information",
    body: [
      "We use information to operate the marketplace, display supplier and product profiles, help buyers contact suppliers, manage authentication, prevent abuse, improve the service, and provide support.",
      "We do not sell personal information. We do not use Google user data for advertising, profiling, or unrelated third-party purposes.",
    ],
  },
  {
    title: "3. Sharing and service providers",
    body: [
      "Public marketplace information, such as supplier profiles and product listings, may be visible to visitors of Shopfy.",
      "We may use trusted service providers, including hosting, database, authentication, analytics, or communication providers, only as needed to run Shopfy and protect the service.",
    ],
  },
  {
    title: "4. Google user data",
    body: [
      "Shopfy accesses Google user data only with your consent and only for the purposes shown during sign-in or authorization.",
      "Shopfy's use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.",
    ],
  },
  {
    title: "5. Cookies and local storage",
    body: [
      "Shopfy may use cookies and local storage to keep you signed in, remember language and theme preferences, maintain favorites, and improve the browsing experience.",
    ],
  },
  {
    title: "6. Data retention and security",
    body: [
      "We keep information for as long as needed to provide Shopfy, comply with legal obligations, resolve disputes, and protect users.",
      "We use reasonable technical and organizational safeguards, but no internet service can be guaranteed to be completely secure.",
    ],
  },
  {
    title: "7. Your choices",
    body: [
      "You may request access, correction, or deletion of your personal information. You may also stop using Google sign-in or revoke app access from your Google Account security settings.",
    ],
  },
  {
    title: "8. Contact",
    body: [
      "For privacy questions or requests, contact Shopfy by WhatsApp at +229 01 49 34 12 19.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="mb-8">
          <BrandLogo sizes="150px" className="h-12 w-auto" />
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm font-bold text-gray-500 dark:text-gray-300">
            Last updated: June 6, 2026
          </p>
          <p className="mt-5 leading-7 text-gray-600 dark:text-gray-300">
            This Privacy Policy explains how Shopfy collects, uses, shares, and protects information
            when you use shopfy.site and related Shopfy services.
          </p>
        </div>

        <div className="grid gap-5">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900"
            >
              <h2 className="text-xl font-black text-gray-950 dark:text-white">{section.title}</h2>
              <div className="mt-3 grid gap-3 leading-7 text-gray-600 dark:text-gray-300">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
