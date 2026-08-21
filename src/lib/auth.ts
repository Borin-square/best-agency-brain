export type Role = "owner" | "coord" | "dev";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

export interface Session {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

export function isOwner(session: Session | null): boolean {
  return session?.role === "owner";
}

export function isDev(session: Session | null): boolean {
  return session?.role === "dev" || session?.role === "owner";
}

export function canManageAgents(session: Session | null): boolean {
  // Owner e Dev possono lanciare/configurare agenti; Coord solo osserva.
  return isDev(session);
}
