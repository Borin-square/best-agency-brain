import { NextResponse, type NextRequest } from "next/server";

// Supabase magic link callback.
// Il client Supabase gestisce automaticamente il token nel fragment URL,
// quindi qui basta redirigere alla dashboard.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  return NextResponse.redirect(new URL("/", url.origin));
}
