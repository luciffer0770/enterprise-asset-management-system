import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    tenantId?: string;
    orgUnitIds?: string[];
  }
  interface Session {
    user: User & {
      id?: string;
      role?: string;
      tenantId?: string;
      orgUnitIds?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: string;
    tenantId?: string;
    orgUnitIds?: string[];
  }
}
