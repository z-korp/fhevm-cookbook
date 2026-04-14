import type { Metadata } from "next";
import Header from "@/components/Header";
import InstallSection from "@/components/InstallSection";
import SkillsList from "@/components/SkillsList";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Skills | FHEVM Cookbook",
  description:
    "Agent skills for Zama FHEVM. Plain markdown, direct source links, and focused guidance for builders and AI agents.",
};

const ASCII_SKILLS = `███████╗██╗  ██╗███████╗██╗   ██╗███╗   ███╗    ███████╗██╗  ██╗██╗██╗     ██╗     ███████╗
██╔════╝██║  ██║██╔════╝██║   ██║████╗ ████║    ██╔════╝██║ ██╔╝██║██║     ██║     ██╔════╝
█████╗  ███████║█████╗  ██║   ██║██╔████╔██║    ███████╗█████╔╝ ██║██║     ██║     ███████╗
██╔══╝  ██╔══██║██╔══╝  ╚██╗ ██╔╝██║╚██╔╝██║    ╚════██║██╔═██╗ ██║██║     ██║     ╚════██║
██║     ██║  ██║███████╗ ╚████╔╝ ██║ ╚═╝ ██║    ███████║██║  ██╗██║███████╗███████╗███████║
╚═╝     ╚═╝  ╚═╝╚══════╝  ╚═══╝  ╚═╝     ╚═╝    ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝`;

export default function SkillsPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 pt-16 pb-20">
        <pre className="ascii-logo mb-10" aria-hidden="true">
          {ASCII_SKILLS}
        </pre>

        <h1 className="mb-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Skills for builders and agents.
        </h1>
        <p className="mb-12 max-w-2xl text-sm leading-relaxed text-secondary sm:text-base">
          Plain markdown skills, focused install commands, direct repo links,
          and task-specific guidance for building on Zama FHEVM.
        </p>

        <InstallSection />
        <SkillsList />
      </main>
      <Footer />
    </>
  );
}
