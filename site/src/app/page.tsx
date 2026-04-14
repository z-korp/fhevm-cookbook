import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import InstallSection from "@/components/InstallSection";
import FeaturedSkillsSection from "@/components/FeaturedSkillsSection";
import GlowBeam from "@/components/GlowBeam";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative mx-auto w-full max-w-6xl flex-1 px-6 sm:px-8">
        <GlowBeam />
        <HeroSection />
        <InstallSection />
        <FeaturedSkillsSection />
      </main>
      <Footer />
    </>
  );
}
