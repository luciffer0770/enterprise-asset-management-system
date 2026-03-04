import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findFirst({
          where: { email: credentials.email, isActive: true },
          include: {
            tenant: true,
            userOrgs: { include: { orgUnit: true } },
          },
        });
        if (!user || !user.passwordHash) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: null,
          role: user.role,
          tenantId: user.tenantId,
          orgUnitIds: user.userOrgs.map((u) => u.orgUnitId),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.orgUnitIds = user.orgUnitIds;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).tenantId = token.tenantId;
        (session.user as Record<string, unknown>).orgUnitIds = token.orgUnitIds;
        (session.user as Record<string, unknown>).id = token.userId ?? token.sub;
      }
      return session;
    },
  },
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
};
