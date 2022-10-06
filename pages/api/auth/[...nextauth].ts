import { PrismaAdapter } from "@next-auth/prisma-adapter"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { userAgent } from "next/server";
import prismadb from '../../../database/prismadb';

// import EmailProvider from "next-auth/providers/email"
// import AppleProvider from "next-auth/providers/apple"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

export async function doesJWTUserExist(username: string) {
  return await prismadb.credential.findUnique({ where: { username: username } });
}

export async function authenticateJWTAndGet(username: string, password: string) {
  const credential = await prismadb.credential.findUnique({
    where: {
      username: username,
    },
    include: {
      role: true,
    }
  });

  if (credential != undefined && credential.password == password) {
    return { id: credential.id, username: credential.username, role: credential.role };
  } else {
    return undefined;
  }
}

export default NextAuth({
  session: {
    strategy: 'jwt'
  },
  adapter: PrismaAdapter(prismadb),

  // https://next-auth.js.org/configuration/providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: any, req: any) {
        const { username, password } = credentials as {
          username: string,
          password: string,
        };

        const credential = await authenticateJWTAndGet(username, password);
        if (credential != undefined) {
          const res = { id: credential.id, name: credential.username, role: credential.role };
          return res;
        }

        return null;
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: any) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user) {
        if (!await doesJWTUserExist(user.name)) {
          return null;
        }

        const u = { id: user.id, name: user.name, role_id: user.role_id };
        token.user = u;
      } else {
        if (!await doesJWTUserExist(token.name)) {
          throw Error("No longer valid.")
        }
      }

      return token;
    },

    async session({ session, token }: any) {
      // Send properties to the client, like an access_token and user id from a provider.
      session.user = token.user;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})