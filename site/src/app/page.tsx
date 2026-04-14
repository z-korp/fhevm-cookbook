import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import InstallSection from "@/components/InstallSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto flex-1 w-full max-w-5xl px-6">
        <HeroSection />
        <InstallSection />
      </main>
      <Footer />
    </>
  );
}
