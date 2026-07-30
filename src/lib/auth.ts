import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers"
import { db } from "@/db";
 
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	// No fixed baseURL: better-auth infers the origin from the incoming request,
	// so the same build works on localhost, the Lovable preview and production.
	trustedOrigins: [
		"http://localhost:3000",
		"http://localhost:8080",
		process.env.NEXT_PUBLIC_SITE_URL || "",
		process.env.BETTER_AUTH_URL || "",
		process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
		"https://*.lovable.app",
		"https://*.lovableproject.com",
		"https://*.vercel.app",
		"https://*.orchids.page",
	].filter(Boolean),
	emailAndPassword: {    
		enabled: true
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID || "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		},
	},
	plugins: [bearer()]
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}