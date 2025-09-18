"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export function Appbar() {
  const { data: session, status } = useSession();

  return (
    <div>
      <div className="flex justify-between">
        <div>Muze</div>
        <div>
          {!session?.user && (<button className="m-2 p-2 bg-amber-600" onClick={() => signIn()}>Sign In</button>)}
          {session?.user && (<button className="m-2 p-2 bg-amber-600" onClick={() => signOut()}>SignOut</button>)}
        </div>
      </div>
    </div>
  );
}
