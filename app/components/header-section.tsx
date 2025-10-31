"use client";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
// import { Users } from "lucide-react"; // unused
import LiquidChrome from "@/components/LiquidChrome"; // Adjust path as needed

export function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden text-white">
      {/* LiquidChrome Background */}
      <div className="absolute inset-0 z-0">
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={1}
          amplitude={0.6}
          interactive={true}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black z-10" />

      {/* Foreground Content */}
      <div className="relative z-20 flex items-center justify-center h-full px-8">
        <div className="max-w-full text-center">
          {/* Heading */}
    
          <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight text-white text-center mb-10 uppercase">
  <span className="block">SECURELY BUILD, STREAM, AND SYNC YOUR VIBE</span>
  <span className="block">WITH YOUR CREW—ON A COLLABORATIVE</span>
  <span className="block text-accent"> MUSIC-FIRST PLATFORM.</span>
</h2>


          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
             
             
              className="flex items-center gap-3 px-6 py-2 text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300  rounded-lg "
              onClick={() => signIn()}
            >
             
              Explore the Product
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
