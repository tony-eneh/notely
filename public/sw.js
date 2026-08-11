/*
 * Notely service worker.
 *
 * Hand-written on purpose: @ducanh2912/next-pwa hooks into webpack, and this
 * app builds with Turbopack, so the generated worker was never emitted and the
 * whole PWA layer (offline, background sync, push) silently did nothing.
 *
 * Responsibilities:
 *  - precache an offline fallback and serve it when a navigation fails
 *  - cache-first for immutable build assets, network-first for note data
 *  - queue note writes made while offline and replay them once back online
 *  - show push notifications and focus the right tab when one is clicked
 */

const VERSION = "v1";
const STATIC_CACHE = `notely-static-${VERSION}`;
const PAGES_CACHE = `notely-pages-${VERSION}`;
const API_CACHE = `notely-api-${VERSION}`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE, API_CACHE];

const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/icon-192x192.png", "/manifest.json"];

const API_NOTES_PATH = /^\/api\/notes(\/|$)/;
const NETWORK_TIMEOUT_MS = 3000;

// ---------------------------------------------------------------------------
// Outbox (IndexedDB) - holds note writes attempted while offline
// ---------------------------------------------------------------------------

const DB_NAME = "notely-outbox";
const DB_VERSION = 1;
const STORE = "requests";
const SYNC_TAG = "notely-sync";

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

async function queueRequest(entry) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).add(entry);
  await txDone(tx);
  db.close();
}

async function readQueue() {
  const db = await openDb();
  const tx = db.transaction(STORE, "readonly");
  const all = await new Promise((resolve, reject) => {
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return all.sort((a, b) => a.queuedAt - b.queuedAt);
}

async function removeFromQueue(id) {
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).delete(id);
  await txDone(tx);
  db.close();
}

async function serializeRequest(request) {
  const headers = {};
  request.headers.forEach((value, key) => {
    // Cookies are attached by the browser on replay; copying auth headers
    // verbatim would risk replaying a stale token.
    if (key !== "cookie" && key !== "authorization") headers[key] = value;
  });

  return {
    url: request.url,
    method: request.method,
    headers,
    body: await request.clone().text(),
    queuedAt: Date.now(),
  };
}

/**
 * Replays queued writes oldest-first.
 *
 * A 4xx means the request will never succeed (note deleted, no longer
 * authorized), so it is dropped. Network errors and 5xx are left in place and
 * the rejection asks the browser to retry the sync later.
 */
async function drainQueue() {
  const entries = await readQueue();
  if (!entries.length) return;

  let replayed = 0;
  let retryLater = false;

  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body || undefined,
        credentials: "include",
      });

      if (response.ok || (response.status >= 400 && response.status < 500)) {
        await removeFromQueue(entry.id);
        if (response.ok) replayed += 1;
      } else {
        retryLater = true;
      }
    } catch {
      retryLater = true;
      break; // still offline; stop hammering the network
    }
  }

  await broadcast({ type: "notely-sync-complete", replayed, pending: retryLater });

  if (retryLater) {
    throw new Error("Notely: some queued writes still pending");
  }
}

async function broadcast(message) {
  const clientList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });
  for (const client of clientList) client.postMessage(message);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Individually so one missing asset cannot fail the whole install.
      await Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => undefined))
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("notely-") && !CURRENT_CACHES.includes(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
      await drainQueue().catch(() => undefined);
    })()
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(drainQueue());
  }
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "notely-flush-queue") {
    event.waitUntil(drainQueue().catch(() => undefined));
  } else if (type === "notely-clear-caches") {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names.filter((n) => n.startsWith("notely-")).map((n) => caches.delete(n))
          )
        )
    );
  }
});

// ---------------------------------------------------------------------------
// Fetch strategies
// ---------------------------------------------------------------------------

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:png|jpe?g|gif|svg|webp|ico|woff2?|ttf)$/.test(url.pathname)
  );
}

async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName);

  try {
    const response = await (timeoutMs
      ? Promise.race([
          fetch(request),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), timeoutMs)
          ),
        ])
      : fetch(request));

    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;

    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw error;
  }
}

async function handleNoteWrite(request) {
  // Clone before the fetch: a failed request may have already consumed its
  // body, and the clone is only read if we actually need to queue.
  const pristine = request.clone();

  try {
    return await fetch(request);
  } catch {
    await queueRequest(await serializeRequest(pristine));

    if ("sync" in self.registration) {
      await self.registration.sync.register(SYNC_TAG).catch(() => undefined);
    }

    return new Response(
      JSON.stringify({ queued: true, offline: true }),
      {
        status: 202,
        headers: {
          "Content-Type": "application/json",
          "X-Notely-Queued": "1",
        },
      }
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method === "GET" && request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === "GET" && isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (API_NOTES_PATH.test(url.pathname)) {
    if (request.method === "GET") {
      event.respondWith(networkFirst(request, API_CACHE, NETWORK_TIMEOUT_MS));
    } else if (request.method === "PATCH" || request.method === "DELETE") {
      // POST deliberately passes through: creating a note needs a
      // server-assigned id, so a queued create has nothing useful to return.
      event.respondWith(handleNoteWrite(request));
    }
  }
});

// ---------------------------------------------------------------------------
// Push notifications
// ---------------------------------------------------------------------------

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { message: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Notely";
  const url = data.url || "/notes";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.message || "You have a new notification.",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notes";

  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
      return undefined;
    })()
  );
});
