"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    const err = await login(email, password);
    if (err) {
      setStatus("idle");
      setError(err);
    } else {
      router.replace("/");
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--bg)",
      }}
    >
      <div className="cd" style={{ width: 380 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 3,
            color: "var(--fg3)",
            marginBottom: 8,
          }}
        >
          BEST AGENCY BRAIN
        </div>
        <h1 style={{ marginBottom: 16 }}>Accedi</h1>

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: 11, color: "var(--fg3)", display: "block", marginBottom: 6 }}>
            EMAIL
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="tuo@email.it"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              color: "var(--fg)",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: "inherit",
              marginBottom: 12,
            }}
          />

          <label style={{ fontSize: 11, color: "var(--fg3)", display: "block", marginBottom: 6 }}>
            PASSWORD
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "var(--bg3)",
              border: "1px solid var(--bd)",
              color: "var(--fg)",
              borderRadius: 6,
              fontSize: 13,
              fontFamily: "inherit",
              marginBottom: 12,
            }}
          />

          <button
            type="submit"
            disabled={status === "loading"}
            className="btn btn-primary"
            style={{ width: "100%" }}
          >
            {status === "loading" ? "Accesso…" : "Accedi"}
          </button>

          {error && <p style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
