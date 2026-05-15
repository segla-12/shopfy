import Link from "next/link";
import type { ReactNode } from "react";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function ButtonLink({ href, children, variant = "primary" }: ButtonLinkProps) {
  const classes = variant === "primary"
    ? "bg-orange-500 text-white hover:bg-orange-600"
    : "border border-gray-200 bg-white text-gray-900 hover:border-orange-200 hover:text-orange-600";

  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-bold transition ${classes}`}
    >
      {children}
    </Link>
  );
}
