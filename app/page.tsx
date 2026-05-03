import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { TriSection } from "@/components/landing/tri-section";
import { DemoSection } from "@/components/landing/demo-section";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <DemoSection />
        <div id="metodologia">
          <TriSection />
        </div>
        <CTA />
      </main>
      <Footer />
    </>
  );
}
