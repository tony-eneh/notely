import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {}, // Explicitly enable Turbopack to avoid webpack conflict
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    importScripts: ["custom-sw.js"],
    runtimeCaching: [
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/notes.*$/,
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "notes-api-cache",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/notes.*$/,
        handler: "NetworkOnly",
        method: "POST",
        options: {
          backgroundSync: {
            name: "notes-post-queue",
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/notes.*$/,
        handler: "NetworkOnly",
        method: "PATCH",
        options: {
          backgroundSync: {
            name: "notes-patch-queue",
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
      {
        urlPattern: /^https?:\/\/[^/]+\/api\/notes.*$/,
        handler: "NetworkOnly",
        method: "DELETE",
        options: {
          backgroundSync: {
            name: "notes-delete-queue",
            options: {
              maxRetentionTime: 24 * 60,
            },
          },
        },
      },
    ],
  },
})(nextConfig);
