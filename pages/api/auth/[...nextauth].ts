import { PrismaAdapter } from "@next-auth/prisma-adapter"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { OPTIMIZED_FONT_PROVIDERS } from "next/dist/shared/lib/constants";
import { getRoleById } from "../../../backend/backend";
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

      const credential = await authenticateJWTAndGet(username, password);
      if (credential != undefined) {
        const res = { name: credential.username, role_id: credential.role?.id };
        return res;
      }

      return null;
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID != undefined && process.env.GOOGLE_CLIENT_SECRET != undefined) {
  prodivers.push(GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }));
}

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
        token.id = user.id;

        const role_id = user.role_id;
        if (role_id != undefined) {
          const role = getRoleById(role_id);
          if (role != undefined) {
            token.permissions = Array.from(role.permissions);
          }

          token.role_id = role_id;
        }
      }

      return token;
    },

    async session({ session, token, user }: any) {
      // Send properties to the client, like an access_token and user id from a provider.
      //session.accessToken = token.accessToken;
      session.user.id = token.id;
      session.user.permissions = token.permissions;
      session.user.role_id = token.role_id;

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});