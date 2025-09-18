import { prismaCilent} from "@/app/lib/db";
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    })
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

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
});

export { handler as GET, handler as POST };
