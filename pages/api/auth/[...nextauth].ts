import { PrismaAdapter } from "@next-auth/prisma-adapter"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { OPTIMIZED_FONT_PROVIDERS } from "next/dist/shared/lib/constants";
import { getRoleById } from "../../../backend/backend";
import prismadb from '../../../database/prisma';
import { sanitizeRole } from "../roles/[pid]";
import { sanitizeUser } from "../users/[pid]";

// import EmailProvider from "next-auth/providers/email"
// import AppleProvider from "next-auth/providers/apple"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options

export async function doesJWTUserExist(username: string) {
  return await prismadb.user.findUnique({ where: { username: username } });
}

export async function authenticateJWTAndGet(username: string, password: string) {
  let user
  try {
    user = await prismadb.user.findUnique({
      where: {
        username: username,
      },
      include: {
        role: {
          include: {
            permissions: true,
          }
        }
      }
    })
  } catch (ex) {
    console.log("Login failed:")
    console.log(ex)
  }

  if (user != undefined && user.password == password) {
    return sanitizeUser(user)
  } else {
    return undefined
  }
}


const prodivers: any[] = [
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
    async authorize(credentials: any, req: any): Promise<any> {
      const { username, password } = credentials as {
        username: string,
        password: string,
      };

      return await authenticateJWTAndGet(username, password)
    }
  })
];

export default NextAuth({
  session: {
    strategy: 'jwt'
  },
  adapter: PrismaAdapter(prismadb),

  // https://next-auth.js.org/configuration/providers
  providers: prodivers,
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }: any) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user) {
        //token.accessToken = account.access_token;
        token.user = user
      }

      return token;
    },

    async session({ session, token, user }: any) {
      // Send properties to the client, like an access_token and user id from a provider.
      //session.accessToken = token.accessToken;
      session.user = token.user
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});