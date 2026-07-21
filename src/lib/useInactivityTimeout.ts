"use client";

import { useEffect, useRef } from "react";
import { clearServerAuthSession, supabase } from "@/lib/supabase";

const configuredInactivityTimeout = Number(process.env.NEXT_PUBLIC_DASHBOARD_INACTIVITY_TIMEOUT_MS);

export const INACTIVITY_TIMEOUT_MS = Number.isFinite(configuredInactivityTimeout) && configuredInactivityTimeout > 0
  ? configuredInactivityTimeout
  : 5 * 60 * 1000;

type InactivityTimeoutOptions = {
  enabled?: boolean;
  timeoutMs?: number;
  loginPath?: string;
  signOutSupabase?: boolean;
  onLock?: () => void | Promise<void>;
};

export function useInactivityTimeout({
  enabled = true,
  timeoutMs = INACTIVITY_TIMEOUT_MS,
  loginPath = "/auth?reason=inactive",
  signOutSupabase = true,
  onLock,
}: InactivityTimeoutOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLockingRef = useRef(false);
  const onLockRef = useRef(onLock);

  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const lockDashboard = async () => {
      if (isLockingRef.current) {
        return;
      }

      isLockingRef.current = true;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      await onLockRef.current?.();

      if (signOutSupabase) {
        await supabase.auth.signOut();
        await clearServerAuthSession();
      }

      window.history.replaceState(null, "", loginPath);
      window.location.replace(loginPath);
    };

    const resetTimeout = () => {
      if (isLockingRef.current) {
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(lockDashboard, timeoutMs);
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "keydown",
      "mousedown",
      "touchstart",
      "scroll",
    ];
    const eventListener = () => resetTimeout();
    const pageshowListener = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.location.reload();
      }
    };

    resetTimeout();
    activityEvents.forEach((event) => window.addEventListener(event, eventListener, { passive: true }));
    document.addEventListener("visibilitychange", eventListener);
    window.addEventListener("pageshow", pageshowListener);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      activityEvents.forEach((event) => window.removeEventListener(event, eventListener));
      document.removeEventListener("visibilitychange", eventListener);
      window.removeEventListener("pageshow", pageshowListener);
    };
  }, [enabled, loginPath, signOutSupabase, timeoutMs]);
}
