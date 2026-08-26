// Helper condiviso: valida JWT Supabase, ritorna client + profile o error.

import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AuthOk {
  ok: true;
  supabase: SupabaseClient;
  userId: string;
  role: "owner" | "coord" | "dev";
}

export interface AuthErr {
  ok: false;
  error: string;
  status: 401 | 403;
}

const STAFF_ROLES = new Set(["owner", "coord", "dev"]);

export async function requireStaff(req: NextRequest): Promise<AuthOk | AuthErr> {
  const authHeader = req.headers.get("authorization");
  const jwt = authHeader?.replace(/^Bearer\s+/, "");
  if (!jwt) return { ok: false, error: "unauthorized", status: 401 };

  const supabase = createServiceClient();
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData.user) {
    return { ok: false, error: "invalid_token", status: 401 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (!profile || !STAFF_ROLES.has(profile.role)) {
    return { ok: false, error: "forbidden", status: 403 };
  }

  return {
    ok: true,
    supabase,
    userId: userData.user.id,
    role: profile.role as "owner" | "coord" | "dev",
  };
}
