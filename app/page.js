import Image from "next/image";
import styles from "./page.module.css";
import Navbar from "./page/navbar/page";
import Hero from "./page/home/page";
import FeaturesSection from "./page/feature/page";
import HowItWorks from "./page/How-its-work/page";
import Pricing from "./page/pricing/pricing";


export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />

      <section id="features" className="features">
        <FeaturesSection />
      </section>

      <section id="how-it-works" className="features">
        <HowItWorks />
      </section>

      <section id="pricing" className="pricing">
        <Pricing />
      </section>
    </>
  );
}
