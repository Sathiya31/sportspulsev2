import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isAdmin } from "@/config/auth";

const handler = NextAuth({
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    callbacks: {
        async signIn({ user }) {
            // Only allow admin email to sign in
            const isAllowed = isAdmin(user.email);
            if (!isAllowed) {
                throw new Error('AccessDenied');
            }
            return true;
        },
        async jwt({ token }) {
            // Add role to JWT token
            if (token.email) {
                token.role = isAdmin(token.email) ? 'admin' : 'user';
            }
            return token;
        },
        async session({ session, token }) {
            // Add role to session
            if (session.user) {
                session.user.role = token.role as 'admin' | 'user';
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
    },
});

export { handler as GET, handler as POST };
