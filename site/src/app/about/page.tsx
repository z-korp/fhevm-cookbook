import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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
        <h1 className="mb-6 text-[56px] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-[72px] lg:text-[88px]">
          About
        </h1>
        <p className="mb-10 text-base font-medium tracking-[-0.01em] text-secondary sm:text-lg">
          Why we built this
        </p>

        <div className="space-y-6 text-sm leading-relaxed text-secondary sm:text-base">
          <p>
            The <strong className="text-foreground">FHEVM Cookbook</strong> is created by{" "}
            <a
              href="https://zkorp.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              zKorp
            </a>
            , a team specialized in building privacy-oriented dApps on Zama&apos;s FHEVM ecosystem.
          </p>

          <p>
            We built this cookbook to share what we&apos;ve learned building on FHEVM for over a year,
            across multiple mainnet projects. The official Zama documentation is thorough, but
            developers still face high assembly cost when stitching together the right path across
            protocol guides, Relayer SDK docs, OpenZeppelin confidential contracts, and GitHub
            templates.
          </p>

          <p>
            The cookbook reduces that cost. It provides task routing to the narrowest useful context,
            verified implementation patterns, and machine-readable skills that AI agents and editors
            can consume directly. It is not a second docs portal &mdash; every artifact links back to
            the official Zama pages that define the semantics.
          </p>

          <p>
            We consider FHEVM one of the most battle-tested approaches for onchain privacy. Our goal
            is to make onboarding easier and help builders move from market intuition to correct
            technical implementation faster.
          </p>
        </div>

        {/* zKorp at Zama Builder Villa */}
        <div className="mt-12 rounded-2xl border border-border bg-surface/80 p-6 sm:p-8">
          <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.24em] text-foreground">
            Built at Zama Builder Villa
          </p>
          <p className="text-sm leading-relaxed text-secondary sm:text-base">
            The zKorp team has been building with FHEVM since the early days, including work at
            the Zama Builder Villa. The cookbook is a direct output of that hands-on experience
            &mdash; distilled into patterns, skills, and guidance that we wish we had when we
            started.
          </p>
        </div>

        {/* Connect */}
        <div className="mt-12">
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
              @zKorp_
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
        </div>
      </main>
      <Footer />
    </>
  );
}
