import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.256 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

const TEAM = [
  {
    name: "Thomas Belloc",
    x: "https://x.com/Cheelax_",
    image: "/about/team/thomas.png",
  },
  {
    name: "Corentin Terrie",
    x: "https://x.com/crowsmos_",
    image: "/about/team/corentin.png",
  },
  {
    name: "Matthias Monnier",
    x: "https://x.com/ProvableMat",
    image: "/about/team/matthias.png",
  },
  {
    name: "Noe Pichot",
    x: "https://x.com/BlackCatRender",
    image: "/about/team/noe.png",
  },
  {
    name: "Steven Klinger",
    x: "https://x.com/Scabanel_",
    image: "/about/team/steven.png",
  },
  {
    name: "Jean Christophe Mehr",
    x: "https://x.com/djizus_",
    image: "/about/team/jc.png",
  },
];

export const metadata: Metadata = {
  title: "About this project | FHEVM Cookbook",
  description:
    "Why zKorp created the FHEVM Cookbook and how it helps builders ship correct privacy-first dApps faster.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-5 pt-16 pb-20 sm:px-6 lg:px-8">
        <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-foreground px-4 py-2 text-zama-yellow">
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full bg-zama-yellow"
              />
              <span className="text-[12px] font-semibold uppercase tracking-[0.22em]">
                Z KORP
              </span>
            </div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.32em] text-foreground">
              {"▸"} About
            </p>
            <h1 className="max-w-4xl text-[42px] font-semibold leading-[1] tracking-[-0.03em] text-foreground sm:text-[54px] lg:text-[66px]">
              Sharing our FHEVM expertise so builders can ship faster.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
              We made this cookbook to help teams avoid the technical traps that slow privacy-first
              products down. It turns what we learned across mainnet projects into short, actionable
              patterns that are easier to reuse.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="https://x.com/zKorp_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-foreground px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-on-dark transition-colors hover:bg-zama-yellow hover:text-foreground"
              >
                Follow us on X
              </Link>
              <Link
                href="https://zkorp.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full border border-border-strong px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-foreground"
              >
                Go to our website
              </Link>
            </div>
          </div>

          <figure className="rounded-3xl border border-border bg-surface p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.map((member) => (
                <div
                  key={member.name}
                  className="overflow-hidden rounded-2xl border border-foreground bg-foreground text-zama-yellow shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
                >
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-44 w-full object-cover object-center sm:h-40"
                    loading="lazy"
                  />
                  <div className="border-t border-zama-yellow/20 p-3">
                    <p className="text-sm font-semibold text-zama-yellow sm:text-[15px]">
                      {member.name}
                    </p>
                    <a
                      href={member.x}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center justify-center rounded-full border border-zama-yellow/30 bg-zama-yellow px-2.5 py-2 text-foreground transition-colors hover:bg-zama-yellow-hover"
                      aria-label={`${member.name} X profile`}
                    >
                      <XIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </figure>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-foreground">
              Avoid traps
            </p>
            <p className="text-sm leading-relaxed text-secondary">
              We highlight the things that usually slow teams down, so you can avoid dead ends
              before they reach production.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-foreground">
              Ship faster
            </p>
            <p className="text-sm leading-relaxed text-secondary">
              The cookbook gives you direct snippets, skills, and patterns instead of making you
              reconstruct the stack from scratch.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-foreground">
              Adopt with confidence
            </p>
            <p className="text-sm leading-relaxed text-secondary">
              We want FHEVM to feel easier to adopt, with less friction for teams that need to
              move from idea to real usage.
            </p>
          </div>
        </section>

        <section className="mt-16 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-border bg-foreground p-6 sm:p-8">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-zama-yellow">
              Onyx story
            </p>
            <h2 className="text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] text-on-dark sm:text-[42px]">
              Onyx on Zama Builder Villa made the cookbook feel obvious.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
              We built Onyx during the Zama Builder Villa, and that experience made the next step
              clear: turn what we learned into a cookbook so other builders can benefit from it too.
              It is our way to centralize practical FHEVM knowledge and help teams ship with fewer
              technical dead ends.
            </p>
            <a
              href="https://x.com/compose/articles/edit/2039631561599877120"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center rounded-full bg-zama-yellow px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.18em] text-foreground transition-colors hover:bg-zama-yellow-hover"
            >
              Read the article
            </a>
          </div>

          <div className="overflow-hidden rounded-3xl border border-border bg-surface">
            <a
              href="https://x.com/zKorp_/status/2039659843171009006"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block h-full min-h-[320px] focus:outline-none"
            >
              <img
                src="/about/onyx-story.jpeg"
                alt="zKorp team at the Zama Builder Villa"
                className="absolute inset-0 h-full w-full object-cover object-[52%_34%] grayscale transition duration-500 group-hover:grayscale-0 group-focus-visible:grayscale-0"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zama-yellow backdrop-blur-sm">
                Builder Villa
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="max-w-[18rem] text-sm leading-relaxed text-white/90">
                  Our team during the Zama Builder Villa event
                </p>
              </div>
            </a>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-muted">
            Connect
          </h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="https://x.com/zKorp_"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground"
            >
              X / zKorp_
            </a>
            <a
              href="https://zkorp.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground"
            >
              zkorp.xyz
            </a>
            <a
              href="mailto:contact@zkorp.xyz"
              className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-foreground"
            >
              contact@zkorp.xyz
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
