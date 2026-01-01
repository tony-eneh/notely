import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Sparkles, FileText, Search, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is logged in, redirect to notes
  if (userId) {
    redirect("/notes");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold">Notely</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container flex flex-col items-center justify-center gap-4 py-24 text-center md:py-32">
          <div className="flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            <span>AI-Powered Note Taking</span>
          </div>
          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Your thoughts,{" "}
            <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              supercharged
            </span>{" "}
            by AI
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl">
            A beautiful, minimal note-taking app with powerful AI features.
            Write faster, think clearer, and organize smarter.
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start Writing Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Features that make writing magical
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to capture your ideas and make them better
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="group rounded-2xl border p-8 transition-all hover:shadow-lg hover:border-indigo-200">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI Autocomplete</h3>
              <p className="text-muted-foreground">
                Let AI continue your thoughts. Just pause typing and watch the
                magic happen.
              </p>
            </div>
            <div className="group rounded-2xl border p-8 transition-all hover:shadow-lg hover:border-indigo-200">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Smart Summaries</h3>
              <p className="text-muted-foreground">
                Get instant AI-generated summaries of your notes. Perfect for
                quick reviews.
              </p>
            </div>
            <div className="group rounded-2xl border p-8 transition-all hover:shadow-lg hover:border-indigo-200">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100 text-pink-600">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Semantic Search</h3>
              <p className="text-muted-foreground">
                Find notes by meaning, not just keywords. AI understands what
                you&apos;re looking for.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/50">
          <div className="container py-24 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              Ready to transform your notes?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              Join thousands of writers, thinkers, and creators using Notely.
            </p>
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-indigo-500 to-purple-600">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold">Notely</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Notely. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
