"use client";
import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import LiquidChrome from "@/components/LiquidChrome"; // Adjust path as needed

export function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden text-white flex items-center justify-center">
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
      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full px-4 sm:px-6 md:px-10 text-center">
        {/* Heading */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-snug sm:leading-tight md:leading-tight tracking-tight text-white uppercase mb-8 sm:mb-10">
          <span className="block">SECURELY BUILD, STREAM, AND SYNC YOUR VIBE</span>
          <span className="block">WITH YOUR CREW—ON A COLLABORATIVE</span>
          <span className="block text-accent">MUSIC-FIRST PLATFORM.</span>
        </h2>

        {/* CTA Button */}
        <div className="flex justify-center">
          <Button
            className="flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3.5 text-sm sm:text-base md:text-lg font-semibold text-white bg-transparent border border-white rounded-lg hover:bg-white hover:text-black transition-all duration-300"
            onClick={() => signIn()}
          >
            Explore the Product
          </Button>
        </div>
      </div>
    </section>
  );
}
