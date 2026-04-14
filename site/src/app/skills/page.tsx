import type { Metadata } from "next";
import Header from "@/components/Header";
import InstallSection from "@/components/InstallSection";
import SkillsList from "@/components/SkillsList";
import ScrollToSkill from "@/components/ScrollToSkill";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Skills | FHEVM Cookbook",
  description:
    "Agent skills for Zama FHEVM. Plain markdown, direct source links, and focused guidance for builders and AI agents.",
};

export default async function SkillsPage({
  searchParams,
}: {
  searchParams?:
    | {
        skill?: string;
      }
    | Promise<{
        skill?: string;
      }>;
}) {
  const resolvedSearchParams = await Promise.resolve(searchParams);
  const openSkillId = resolvedSearchParams?.skill;

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[90rem] flex-1 px-5 pt-16 pb-20 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-[56px] font-semibold leading-[0.95] tracking-[-0.035em] text-foreground sm:text-[72px] lg:text-[88px]">
          Skills
        </h1>
        <p className="mb-12 max-w-2xl text-base leading-relaxed text-secondary sm:text-lg">
          Plain markdown skills, focused install commands, direct repo links,
          and task-specific guidance for building on Zama FHEVM.
        </p>

        <InstallSection />
        <ScrollToSkill skillId={openSkillId} />
        <SkillsList openSkillId={openSkillId} />
      </main>
      <Footer />
    </>
  );
}
