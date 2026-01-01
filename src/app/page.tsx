import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowRight, Feather, Sparkles, FileText, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is logged in, redirect to notes
  if (userId) {
    redirect("/notes");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 md:px-8 flex h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Feather className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display text-xl font-semibold">Notely</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="btn-shine shadow-md shadow-primary/20" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container mx-auto px-6 md:px-8 flex flex-col items-center justify-center gap-6 py-28 text-center md:py-36">
          <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Writing</span>
          </div>
          <h1 className="font-display max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance">
            Where your thoughts{" "}
            <span className="text-primary">
              come alive
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground md:text-xl leading-relaxed">
            A refined writing experience with intelligent AI assistance. 
            Capture ideas effortlessly, organize beautifully, and let your creativity flow.
          </p>
          <div className="flex gap-4 pt-6">
            <Button size="lg" className="btn-shine gap-2 px-6 shadow-lg shadow-primary/25" asChild>
              <Link href="/sign-up">
                Start Writing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-6 border-border/50" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-6 md:px-8 py-28">
          <div className="text-center mb-20">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium mb-4">Features</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl mb-4 text-foreground">
              Designed for thoughtful writing
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Every feature crafted to enhance your creative process
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="card-paper group rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary transition-transform duration-300 group-hover:scale-110">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display mb-3 text-xl font-semibold text-foreground">AI Autocomplete</h3>
              <p className="text-muted-foreground leading-relaxed">
                Let AI continue your thoughts naturally. Pause typing and watch your ideas expand.
              </p>
            </div>
            <div className="card-paper group rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary transition-transform duration-300 group-hover:scale-110">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="font-display mb-3 text-xl font-semibold text-foreground">Smart Summaries</h3>
              <p className="text-muted-foreground leading-relaxed">
                Instant AI summaries of your notes. Perfect for quick reviews and sharing key insights.
              </p>
            </div>
            <div className="card-paper group rounded-2xl border border-border/50 p-8 transition-all duration-300 hover:shadow-xl hover:border-primary/20">
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20 text-primary transition-transform duration-300 group-hover:scale-110">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-display mb-3 text-xl font-semibold text-foreground">Semantic Search</h3>
              <p className="text-muted-foreground leading-relaxed">
                Find notes by meaning, not just keywords. AI understands what you&apos;re looking for.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-muted/30">
          <div className="container mx-auto px-6 md:px-8 py-28 text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-primary font-medium mb-4">Get Started</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl mb-4 text-foreground">
              Begin your writing journey
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Join thoughtful writers who&apos;ve transformed their note-taking experience.
            </p>
            <Button size="lg" className="btn-shine gap-2 px-8 shadow-lg shadow-primary/25" asChild>
              <Link href="/sign-up">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="container mx-auto px-6 md:px-8 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Feather className="h-4 w-4 text-primary" />
            </div>
            <span className="font-display font-semibold">Notely</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Notely. Crafted with care.
          </p>
        </div>
      </footer>
    </div>
  );
}
