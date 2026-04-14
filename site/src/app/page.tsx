import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import InstallSection from "@/components/InstallSection";
import FeaturedSkillsSection from "@/components/FeaturedSkillsSection";
import SpecificSnippetsSection from "@/components/SpecificSnippetsSection";

import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative mx-auto w-full max-w-[90rem] flex-1 px-5 sm:px-6 lg:px-9">
        <HeroSection />
        <InstallSection />
        <FeaturedSkillsSection />
        <SpecificSnippetsSection />
      </main>
      <Footer />
    </>
  );
}
