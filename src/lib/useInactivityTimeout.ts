"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, clearServerAuthSession } from "@/lib/supabase";

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Déconnecte l'utilisateur après une période d'inactivité.
 * Redirige vers la page de connexion et nettoie la session.
 * À utiliser dans les layouts des dashboards sécurisés.
 */
export function useInactivityTimeout() {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = async () => {
    // 1. Déconnexion côté client Supabase
    await supabase.auth.signOut();

    // 2. Nettoyage de la session côté serveur (cookie)
    await clearServerAuthSession();

    // 3. Redirection vers la page de connexion
    // Le rechargement complet de la page garantit que l'état React est vidé.
    router.push("/auth?reason=inactive");
    router.refresh();
  };

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT_MS);
  };

  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

    const eventListener = () => resetTimeout();

    // Initialiser le timeout
    resetTimeout();

    // Ajouter les écouteurs d'événements pour réinitialiser le timeout
    events.forEach((event) => window.addEventListener(event, eventListener));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach((event) => window.removeEventListener(event, eventListener));
    };
  }, [router]);
}