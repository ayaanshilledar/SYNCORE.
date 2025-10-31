import { prismaCilent } from "@/app/lib/db";
import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  secret: process.env.NEXTAUTH_SECRET ?? "secret",
  callbacks: {
    async signIn({ user }) {
      if (!user?.email) return false;

      try {
        const existingUser = await prismaCilent.user.findUnique({
          where: { email: user.email }
        });

        if (!existingUser) {
          await prismaCilent.user.create({
            data: {
              email: user.email,
              provider: "Google"
            }
          });
        }

        return true;
      } catch (error) {
        console.error("Sign-in error:", error);
        return false;
      }
    }
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
