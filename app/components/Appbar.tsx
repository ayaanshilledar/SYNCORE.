"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function Appbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-3 sm:top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[90%] md:w-auto md:min-w-[600px] lg:min-w-[700px] max-w-4xl">
      <div className="flex items-center justify-between gap-3 sm:gap-6 md:gap-8 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-white">
        
        {/* Brand */}
        <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
          SYNCORE
        </h1>

        {/* Authentication */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          {!session?.user && (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-5 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300 rounded-lg border border-white/50"
            >
              <LogIn className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
              <span className="font-medium">Sign In</span>
            </button>
          )}
          {session?.user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src={session.user?.image || "https://ui-avatars.com/api/?name=User"}
                alt="avatar"
                className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border border-white/30 shadow"
              />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white text-black text-xs sm:text-sm md:text-base font-medium hover:bg-gray-100 transition-all duration-200 shadow hover:scale-105 transform"
              >
                <LogOut className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}