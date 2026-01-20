import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  // Explicitly set the base URL for redirects
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Ensure redirects always use the correct base URL
      const actualBaseUrl = process.env.NEXTAUTH_URL || baseUrl;

      // If url is relative, make it absolute with the correct base URL
      if (url.startsWith('/')) return `${actualBaseUrl}${url}`;

      // If url is on the same origin, allow it
      if (new URL(url).origin === actualBaseUrl) return url;

      // Otherwise, redirect to base URL
      return actualBaseUrl;
    },
    async signIn({ user, account, profile }) {
      try {
        if (!user.email) return false;

        // Check if user exists in Supabase
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .single();

        if (!existingUser) {
          // Create new user in Supabase
          const { error } = await supabase
            .from('users')
            .insert([
              {
                email: user.email,
                name: user.name,
                avatar_url: user.image,
                provider: account?.provider,
                provider_account_id: account?.providerAccountId,
              },
            ]);

          if (error) {
            console.error('Error creating user in Supabase:', error);
          }
        } else {
          // Update user info
          await supabase
            .from('users')
            .update({
              name: user.name,
              avatar_url: user.image,
              last_sign_in: new Date().toISOString(),
            })
            .eq('email', user.email);
        }

        return true;
      } catch (error) {
        console.error('SignIn callback error:', error);
        return true; // Allow sign in even if Supabase fails
      }
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
