"use client";

import { UserProfile } from "@clerk/nextjs";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { useState } from "react";
import { usePush } from "@/hooks/use-push";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { status, error, subscribe, sendTest } = usePush();
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    try {
      setIsTesting(true);
      await sendTest();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 mb-8">
        <div className="border rounded-lg p-5 bg-card/50">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Bell className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Push notifications</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Enable reminders and updates. Requires browser permission.
              </p>
              {error && (
                <p className="text-xs text-destructive mt-2">{error}</p>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant={status === "subscribed" ? "secondary" : "default"}
                onClick={subscribe}
                className={cn("gap-2", status === "subscribed" && "bg-emerald-600 text-white")}
              >
                {status === "subscribed" ? (
                  <>
                    <BellRing className="h-4 w-4" />
                    Enabled
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4" />
                    Enable
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={status !== "subscribed" || isTesting}
                className="gap-2"
              >
                {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
                Send test
              </Button>
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Status: {status}
          </div>
        </div>
      </div>

      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border rounded-lg",
          },
        }}
      />
    </div>
  );
}
