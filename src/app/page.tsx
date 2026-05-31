import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Landing page — this is the first thing judges see.
// Goal: communicate the problem + solution in under 10 seconds.
// Server Component: no interactivity needed, fast load.
export default async function Home() {
  // If already signed in, skip the landing page entirely
  const { userId } = await auth()
  if (userId) redirect('/dashboard')
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── Nav ────────────────────────────────────────────────── */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-xl tracking-tight">Career OS</span>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 max-w-4xl mx-auto">
        <Badge variant="secondary" className="mb-6">
          Built for APAC · Talentbank Hackathon 2026
        </Badge>

        <h1 className="text-5xl font-bold tracking-tight leading-tight mb-6">
          Hired on what you{" "}
          <span className="text-blue-600">can do</span>,<br />
          not where you went to school.
        </h1>

        <p className="text-xl text-zinc-500 max-w-2xl mb-10">
          Talented graduates across Asia are filtered out before a human ever
          reads their name. Career OS matches employers to candidates based on
          proven skills — not credentials.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="/sign-up?role=candidate">
            <Button size="lg" className="px-8">
              I&apos;m looking for work
            </Button>
          </Link>
          <Link href="/sign-up?role=employer">
            <Button size="lg" variant="outline" className="px-8">
              I&apos;m hiring
            </Button>
          </Link>
        </div>
      </main>

      {/* ── How it works ────────────────────────────────────────── */}
      <section className="border-t bg-zinc-50 px-6 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Build your Skills Vault",
                description:
                  "Import GitHub repos, add projects, log freelance work. AI extracts and verifies your real skills — beyond what a CV can show.",
              },
              {
                step: "02",
                title: "Get matched on ability",
                description:
                  "Our matching engine compares your skill profile against job requirements using AI embeddings. No keyword games. No school-name filters.",
              },
              {
                step: "03",
                title: "Know exactly what to fix",
                description:
                  "See your match score for every role. Get an honest gap analysis and specific steps to close it. Your score improves as you grow.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl p-6 border">
                <span className="text-4xl font-bold text-blue-100">{item.step}</span>
                <h3 className="text-lg font-semibold mt-2 mb-2">{item.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
