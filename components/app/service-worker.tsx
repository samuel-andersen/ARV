"use client";

import { useEffect } from "react";

/**
 * Registers the service worker in the browser (production only). Effect-only.
 * The SW is network-first for navigations, so this never risks serving a stale
 * app while online — it just adds instant asset loads and an offline fallback.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const register = () =>
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* registration failed — app still works, just no offline shell */
      });
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
