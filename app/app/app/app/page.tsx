"use client"
import Image from "next/image";
import { Appbar } from "./components/Appbar";
import { HeroSection } from "./components/header-section";
import { Redirect } from "./components/redirect";
import LiquidChrome from "./components/LiquidChrome";

export default function Home() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* LiquidChrome background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={1}
          amplitude={0.6}
          interactive={true}
        />
      </div>
  
      {/* Foreground content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Appbar />
        <Redirect />
        <HeroSection />
      </div>
    </div>
  );
  
}  
