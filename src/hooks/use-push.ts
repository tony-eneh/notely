"use client";

import { useState, useCallback } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePush() {
  const [status, setStatus] = useState<"idle" | "prompt" | "subscribed" | "denied" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const subscribe = useCallback(async () => {
    try {
      setError(null);
      if (!VAPID_PUBLIC_KEY) {
        setError("Missing VAPID public key");
        setStatus("error");
        return;
      }
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError("Push not supported in this browser");
        setStatus("error");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setStatus("denied");
        return;
      }
      if (permission !== "granted") {
        setStatus("prompt");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: existing }),
        });
        setStatus("subscribed");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      setStatus("subscribed");
    } catch (err) {
      console.error("Push subscribe failed", err);
      setError("Failed to enable notifications");
      setStatus("error");
    }
  }, []);

  const sendTest = useCallback(async () => {
    try {
      const res = await fetch("/api/push/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Notely", message: "Notifications are set up." }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send test notification");
      }
    } catch (err) {
      console.error("Push test failed", err);
      setError("Failed to send test notification");
    }
  }, []);

  return { status, error, subscribe, sendTest };
}
