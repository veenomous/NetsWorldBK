import type { NextAuthOptions } from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0",
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      // Upsert user into Supabase on every login
      const twitterProfile = profile as { data?: { id?: string; username?: string; name?: string; profile_image_url?: string } };
      const xData = twitterProfile?.data || {};
      const xId = xData.id || user.id;
      const xHandle = xData.username || user.name || "unknown";
      const xName = xData.name || user.name || "Anonymous";
      const xAvatar = xData.profile_image_url || user.image || "";

      await supabase.from("users").upsert(
        {
          x_id: xId,
          x_handle: xHandle,
          x_name: xName,
          x_avatar: xAvatar.replace("_normal", "_200x200"), // Higher res avatar
          updated_at: new Date().toISOString(),
        },
        { onConflict: "x_id" }
      );

      return true;
    },
    async jwt({ token, user, profile }) {
      if (user) {
        const twitterProfile = profile as { data?: { id?: string; username?: string } };
        token.xId = twitterProfile?.data?.id || user.id;
        token.xHandle = twitterProfile?.data?.username || user.name || undefined;
        token.picture = user.image?.replace("_normal", "_200x200") || undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { xId?: string }).xId = token.xId as string;
        (session.user as { xHandle?: string }).xHandle = token.xHandle as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Redirect to home on sign in (we use a modal/button, not a page)
  },
};
