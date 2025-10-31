"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function Appbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-4 sm:top-6 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] md:w-auto md:max-w-2xl left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 md:px-8 py-3 rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-white">
        
        {/* Brand */}
        <h1 className="text-lg sm:text-xl font-extrabold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          SYNCORE
        </h1>

        {/* Authentication */}
        <div className="flex items-center gap-2 sm:gap-4">
          {!session?.user && (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 text-sm sm:text-base text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300 rounded-lg"
            >
              <LogIn size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-small hidden xs:inline">Sign In</span>
              <span className="font-small xs:hidden">In</span>
            </button>
          )}
          {session?.user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <img
                src={session.user?.image || "https://ui-avatars.com/api/?name=User"}
                alt="avatar"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 shadow"
              />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white text-black text-sm sm:text-base font-medium hover:bg-gray-100 transition-all duration-200 shadow"
              >
                <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden xs:inline">Sign Out</span>
                <span className="xs:hidden">Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}