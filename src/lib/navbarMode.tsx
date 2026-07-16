"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type NavbarMode = "gros" | "detail";

type NavbarModeContextValue = {
  mode: NavbarMode;
  setMode: (mode: NavbarMode) => void;
};

const NAVBAR_MODE_KEY = "shopfy-navbar-mode";
const NavbarModeContext = createContext<NavbarModeContextValue | null>(null);

export function NavbarModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<NavbarMode>("gros");
  const shouldRedirect = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    window.localStorage.setItem(NAVBAR_MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!shouldRedirect.current || !pathname) {
      return;
    }

    if (mode === "detail" && pathname !== "/stores") {
      router.push("/stores");
    }

    if (mode === "gros" && pathname !== "/") {
      router.push("/");
    }

    shouldRedirect.current = false;
  }, [mode, pathname, router]);

  const setMode = (nextMode: NavbarMode) => {
    shouldRedirect.current = true;
    setModeState(nextMode);
  };

  const value = useMemo(
    () => ({ mode, setMode }),
    [mode],
  );

  return <NavbarModeContext.Provider value={value}>{children}</NavbarModeContext.Provider>;
}

export function useNavbarMode() {
  const context = useContext(NavbarModeContext);

  if (!context) {
    throw new Error("useNavbarMode must be used inside NavbarModeProvider");
  }

  return context;
}
