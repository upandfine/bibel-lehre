"use client";

import { useEffect } from "react";

/**
 * Registriert den Service Worker (public/sw.js) — nur in Production und nur
 * wenn der Browser ihn unterstützt. In Dev bewusst aus, weil ein SW mit dem
 * Next-HMR/Hot-Reload kollidiert und Caching-Verwirrung stiftet.
 *
 * Rendert nichts; reiner Seiteneffekt beim Mount.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Registrierung ist best-effort — die App funktioniert auch ohne SW.
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
