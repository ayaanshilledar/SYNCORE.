"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function Appbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-3 sm:top-5 md:top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] sm:w-[85%] md:max-w-3xl">
      <div className="flex items-center justify-between gap-3 sm:gap-6 px-3 sm:px-5 md:px-8 py-2.5 sm:py-3 rounded-2xl
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-white">
        
        {/* Brand */}
        <h1 className="text-base sm:text-xl md:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          SYNCORE
        </h1>

        {/* Authentication */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!session?.user && (
            <button
              onClick={() => signIn("google")}
              className="flex items-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base text-white bg-transparent border border-white/20 hover:bg-white hover:text-black transition-all duration-300 rounded-lg"
            >
              <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline font-medium">Sign In</span>
              <span className="sm:hidden font-medium">In</span>
            </button>
          )}

          {session?.user && (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <img
                src={session.user?.image || "https://ui-avatars.com/api/?name=User"}
                alt="avatar"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 shadow"
              />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white text-black text-xs sm:text-sm md:text-base font-semibold hover:bg-gray-100 transition-all duration-300 shadow"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
