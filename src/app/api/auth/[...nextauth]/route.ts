import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// Set NEXTAUTH_URL dynamically for Vercel preview deploys
if (!process.env.NEXTAUTH_URL) {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    // Production: use the custom domain
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  } else if (process.env.VERCEL_URL) {
    // Preview: use the auto-generated Vercel URL
    process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
  }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
