import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import webpush from "web-push";
import { db } from "@/lib/db";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (PUBLIC_KEY && PRIVATE_KEY) {
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!PUBLIC_KEY || !PRIVATE_KEY) {
      return NextResponse.json({ error: "VAPID keys missing" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const title = body.title || "Notely";
    const message = body.message || "Your test notification is working.";

    const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
    if (!subscriptions.length) {
      return NextResponse.json({ error: "No subscriptions found" }, { status: 404 });
    }

    const payload = JSON.stringify({
      title,
      message,
      url: body.url || "/notes",
    });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    const rejected = results.filter((r) => r.status === "rejected");
    if (rejected.length === results.length) {
      return NextResponse.json({ error: "All pushes failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sent: results.length, failed: rejected.length });
  } catch (error) {
    console.error("[PUSH_TEST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
