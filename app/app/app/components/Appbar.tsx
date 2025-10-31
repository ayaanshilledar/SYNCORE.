"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";

export function Appbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed top-6 w-2xl left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center justify-between gap-8 px-8 py-3 rounded-2xl 
        bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg text-white">
        
        
        <h1 className="text-xl font-extrabold tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
          SYNCORE
        </h1>

      
        <div className="flex items-center gap-4">
          {!session?.user && (
            <button
              onClick={() => signIn()}
              className="flex items-center gap-3 px-6 py-2 text-white bg-transparent hover:bg-white hover:text-black transition-colors duration-300  rounded-lg "
            >
              <LogIn size={18} />
              <span className="font-small">Sign In</span>
            </button>
          )}
          {session?.user && (
            <div className="flex items-center gap-3">
              <img
                src={session.user?.image || "https://ui-avatars.com/api/?name=User"}
                alt="avatar"
                className="w-8 h-8 rounded-full border border-white/30 shadow"
              />
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-black font-medium hover:bg-gray-100 transition-all duration-200 shadow"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
