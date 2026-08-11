"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that lives at /public/sw.js.
 *
 * next-pwa used to inject this, but it is a webpack plugin and this app builds
 * with Turbopack, so nothing was ever registered and offline support, background
 * sync and push notifications were all inert.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    // Ask the worker to replay anything queued while we were offline.
    const flush = () => {
      navigator.serviceWorker.controller?.postMessage({
        type: "notely-flush-queue",
      });
    };

    window.addEventListener("online", flush);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        flush();

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "activated") flush();
          });
        });
      })
      .catch((error) => {
        console.error("[SW] registration failed", error);
      });

    return () => window.removeEventListener("online", flush);
  }, []);

  return null;
}
