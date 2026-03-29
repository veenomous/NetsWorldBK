import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      xId?: string;
      xHandle?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    xId?: string;
    xHandle?: string;
  }
}
