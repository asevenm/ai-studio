import NextAuth from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt" as const,
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    // 邮箱密码登录
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          return null;
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            image: user.image,
            credits: user.credits,
        };
      },
    }),
    // 手机验证码登录（自动注册）
    CredentialsProvider({
      id: "phone",
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          return null;
        }

        // 验证验证码
        const smsCode = await prisma.smsCode.findFirst({
          where: {
            phone: credentials.phone,
            code: credentials.code,
            used: false,
            expires: {
              gte: new Date(),
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!smsCode) {
          return null;
        }

        // 标记验证码为已使用
        await prisma.smsCode.update({
          where: { id: smsCode.id },
          data: { used: true },
        });

        // 查找或创建用户（自动注册）
        let user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          // 用户不存在，自动注册
          user = await prisma.user.create({
            data: {
              phone: credentials.phone,
              phoneVerified: new Date(),
              name: `用户${credentials.phone.slice(-4)}`,
              credits: 100,
            },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          image: user.image,
          credits: user.credits,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }: any) {
        if (user) {
            token.id = user.id;
            token.credits = user.credits;
            token.phone = user.phone;
        }
        // Update credits if session is updated (e.g. after deduction)
        if (trigger === "update" && session?.user?.credits) {
            token.credits = session.user.credits;
        }
        return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.credits = token.credits;
        session.user.phone = token.phone;
      }
      return session;
    },
  },
  pages: {
      signIn: '/auth/login',
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
