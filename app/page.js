import Image from "next/image";
import styles from "./page.module.css";
import Navbar from "./page/navbar/page";
import Hero from "./page/home/page";
import FeaturesSection from "./page/feature/page";
import HowItWorks from "./page/How-its-work/page";
import { Import } from "lucide-react";
export default function Home() {
  return (
    <>
     <Navbar />
    <Hero />
    <FeaturesSection/>
<HowItWorks/>    
    
    </>
  );
}
