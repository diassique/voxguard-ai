// NOTE: NextAuth API route is currently disabled
// The app now uses Supabase Auth for authentication
// To re-enable NextAuth with Google OAuth, uncomment the code below

/*
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
*/

// Temporary placeholder to prevent 404
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "NextAuth is currently disabled. Using Supabase Auth." },
    { status: 404 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "NextAuth is currently disabled. Using Supabase Auth." },
    { status: 404 }
  );
}
