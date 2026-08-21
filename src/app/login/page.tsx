"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const { loginWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const err = await loginWithMagicLink(email.trim().toLowerCase());
    if (err) {
      setStatus("error");
      setError(err);
    } else {
      setStatus("sent");
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
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: "var(--fg3)", marginBottom: 8 }}>
          BEST AGENCY BRAIN
        </div>
        <h1 style={{ marginBottom: 16 }}>Accedi</h1>

        {status === "sent" ? (
          <div>
            <p style={{ color: "var(--grn)", fontSize: 13, marginBottom: 8 }}>Link inviato.</p>
            <p className="muted">Controlla la tua mail e clicca sul link per accedere.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{ fontSize: 11, color: "var(--fg3)", display: "block", marginBottom: 6 }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
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
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {status === "sending" ? "Invio…" : "Invia link magico"}
            </button>
            {error && (
              <p style={{ color: "var(--red)", fontSize: 12, marginTop: 10 }}>{error}</p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
