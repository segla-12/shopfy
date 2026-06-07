import type { Metadata } from "next";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Terms of Service - Shopfy",
  description: "Shopfy terms of service and marketplace rules.",
  alternates: {
    canonical: "/terms",
  },
};

const sections = [
  {
    title: "1. Acceptance of these terms",
    body: [
      "By accessing or using Shopfy, you agree to these Terms of Service. If you do not agree, you should not use the service.",
    ],
  },
  {
    title: "2. About Shopfy",
    body: [
      "Shopfy is a marketplace and wholesale directory that helps buyers discover suppliers, stores, products, and contact information.",
      "Shopfy does not own the listed products, does not act as the seller, and is not a party to transactions between buyers, suppliers, sellers, delivery providers, or other users.",
    ],
  },
  {
    title: "3. User accounts and Google sign-in",
    body: [
      "You are responsible for the accuracy of the information you provide and for keeping your account secure.",
      "If you use Google sign-in, you authorize Shopfy to use the account information you approve only to create, secure, and manage your Shopfy account.",
    ],
  },
  {
    title: "4. Listings and supplier information",
    body: [
      "Users who publish listings must provide accurate, lawful, and up-to-date information about products, prices, availability, business identity, delivery options, and contact details.",
      "Shopfy may remove listings, stores, supplier profiles, or accounts that appear misleading, illegal, abusive, unsafe, fraudulent, or harmful to the marketplace.",
    ],
  },
  {
    title: "5. Buyer responsibility and transaction safety",
    body: [
      "Buyers are responsible for verifying products, supplier identity, delivery terms, payment terms, and any other transaction details before making a payment or accepting delivery.",
      "Payment on delivery or another secure method is strongly recommended. Do not make payments before sufficient verification.",
    ],
  },
  {
    title: "6. Prohibited use",
    body: [
      "You may not use Shopfy for fraud, scams, illegal products, impersonation, spam, harassment, intellectual property violations, unauthorized scraping, or activity that damages the service or other users.",
    ],
  },
  {
    title: "7. Third-party services",
    body: [
      "Shopfy may link to or integrate third-party services such as Google, WhatsApp, Facebook, hosting providers, databases, authentication providers, or delivery contacts. Those services are governed by their own terms and policies.",
    ],
  },
  {
    title: "8. Limitation of liability",
    body: [
      "Shopfy is provided as a marketplace and directory service. To the maximum extent permitted by law, Shopfy is not responsible for disputes, fraud, scams, product quality, delivery failures, payment issues, or agreements made directly between users.",
    ],
  },
  {
    title: "9. Changes to the service or terms",
    body: [
      "Shopfy may update the service or these terms from time to time. Continued use of Shopfy after updates means you accept the updated terms.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      "For questions about these terms, contact Shopfy by WhatsApp at +229 01 49 34 12 19.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 transition-colors dark:bg-gray-950">
      <Navbar />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <div className="mb-8">
          <BrandLogo sizes="150px" className="h-12 w-auto" />
          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-950 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm font-bold text-gray-500 dark:text-gray-300">
            Last updated: June 6, 2026
          </p>
          <p className="mt-5 leading-7 text-gray-600 dark:text-gray-300">
            These Terms of Service explain the rules for using shopfy.site and related Shopfy
            services.
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
