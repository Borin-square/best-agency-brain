import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";

// Restituisce l'URL pubblico del CSV export con token, da incollare in WP All Import.
// Autenticato: solo owner/dev possono vedere il token.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || (profile.role !== "owner" && profile.role !== "dev")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = process.env.EXPORT_TOKEN ?? null;
  const origin = new URL(req.url).origin;
  const url = token
    ? `${origin}/api/export/agencies.csv?token=${token}`
    : `${origin}/api/export/agencies.csv`;

  return NextResponse.json({ url, token_required: Boolean(token) });
}
