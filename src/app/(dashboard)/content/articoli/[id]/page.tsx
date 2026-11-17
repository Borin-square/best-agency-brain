"use client";

// Contenuti → modifica di un articolo del magazine.
// Lo slug è l'URL dell'articolo sul sito (/{slug}/): dopo la pubblicazione non si cambia più
// (lo blocca anche il DB). Un articolo pubblicato non si elimina: si rimette in bozza.

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDomain } from "@/components/DomainProvider";
import { apiStaff, inputStyle } from "@/components/content/api";
import { ContentNav } from "@/components/content/ContentNav";
import { MarkdownEditor } from "@/components/content/MarkdownEditor";

interface Articolo {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md: string;
  cover_url: string | null;
  cover_alt: string | null;
  cover_width: number | null;
  cover_height: number | null;
  author_id: string | null;
  status: "draft" | "publish";
  published_at: string | null;
  seo_title: string | null;
  meta_description: string | null;
  category_ids: string[];
}
interface Voce {
  id: string;
  name: string;
}

/** Data ISO → valore per <input type="datetime-local"> nell'ora locale. */
const perInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export default function ArticoloPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentDomainId, loading: domainLoading } = useDomain();
  const [a, setA] = useState<Articolo | null>(null);
  const [autori, setAutori] = useState<Voce[]>([]);
  const [categorie, setCategorie] = useState<Voce[]>([]);
  const [errore, setErrore] = useState<string | null>(null);
  const [stato, setStato] = useState<string | null>(null);
  const [lavoro, setLavoro] = useState(false);

  const carica = useCallback(async () => {
    if (!currentDomainId) return;
    try {
      const [articolo, au, ca] = await Promise.all([
        apiStaff<Articolo>(`/api/content/articles/${id}`),
        apiStaff<{ rows: Voce[] }>(`/api/content/authors?domain_id=${currentDomainId}`),
        apiStaff<{ rows: Voce[] }>(`/api/content/categories?domain_id=${currentDomainId}`),
      ]);
      setA(articolo);
      setAutori(au.rows);
      setCategorie(ca.rows);
    } catch (e) {
      setErrore((e as Error).message);
    }
  }, [id, currentDomainId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- caricamento iniziale, come le altre pagine del brain
    if (!domainLoading) carica();
  }, [domainLoading, carica]);

  const set = <K extends keyof Articolo>(k: K, v: Articolo[K]) => setA((x) => (x ? { ...x, [k]: v } : x));

  async function salva(e?: React.FormEvent) {
    e?.preventDefault();
    if (!a) return;
    setLavoro(true);
    setErrore(null);
    try {
      const nuovo = await apiStaff<Articolo>(`/api/content/articles/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: a.title,
          slug: a.slug,
          excerpt: a.excerpt ?? "",
          body_md: a.body_md,
          cover_alt: a.cover_alt ?? "",
          author_id: a.author_id,
          status: a.status,
          published_at: a.published_at,
          seo_title: a.seo_title ?? "",
          meta_description: a.meta_description ?? "",
          category_ids: a.category_ids,
        }),
      });
      setA(nuovo);
      setStato("Salvato");
      setTimeout(() => setStato(null), 2000);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setLavoro(false);
  }

  async function copertina(corpo: FormData | { url: string }) {
    setLavoro(true);
    setErrore(null);
    try {
      const r = await apiStaff<Pick<Articolo, "cover_url" | "cover_width" | "cover_height">>(`/api/content/articles/${id}/cover`, {
        method: "POST",
        body: corpo instanceof FormData ? corpo : JSON.stringify(corpo),
      });
      setA((x) => (x ? { ...x, ...r } : x));
      setStato("Copertina aggiornata");
      setTimeout(() => setStato(null), 2000);
    } catch (e) {
      setErrore((e as Error).message);
    }
    setLavoro(false);
  }

  async function elimina() {
    if (!confirm("Eliminare definitivamente questa bozza?")) return;
    try {
      await apiStaff(`/api/content/articles/${id}`, { method: "DELETE" });
      router.push("/content");
    } catch (e) {
      setErrore((e as Error).message);
    }
  }

  if (!a) {
    return (
      <div>
        <ContentNav />
        <p className={errore ? "" : "muted"} style={errore ? { color: "var(--red)" } : {}}>
          {errore ?? "Caricamento…"}
        </p>
      </div>
    );
  }

  const mai_pubblicato = !a.published_at;
  const esterna = a.cover_url && !a.cover_url.includes(".supabase.co/");

  return (
    <form onSubmit={salva}>
      <ContentNav />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <h1 style={{ margin: 0, flex: 1 }}>{a.title || "Senza titolo"}</h1>
        {stato && <span style={{ color: "var(--green, #22c55e)", fontSize: 13 }}>✓ {stato}</span>}
        <button type="submit" className="btn btn-primary" disabled={lavoro}>
          {lavoro ? "Salvataggio…" : "Salva"}
        </button>
      </div>
      {errore && <p style={{ color: "var(--red)", marginBottom: 12 }}>{errore}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 20 }}>
          <div className="cd">
            <div className="lb">Titolo</div>
            <input value={a.title} onChange={(e) => set("title", e.target.value)} required style={{ ...inputStyle, fontSize: 16 }} />
            <div className="lb" style={{ marginTop: 16 }}>
              Slug (URL: /{a.slug}/)
            </div>
            <input
              value={a.slug}
              onChange={(e) => set("slug", e.target.value)}
              readOnly={!mai_pubblicato}
              style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", color: mai_pubblicato ? undefined : "var(--fg3)" }}
            />
            <p className="muted" style={{ marginTop: 6 }}>
              {mai_pubblicato
                ? "Si può cambiare finché l'articolo non viene pubblicato. Non può coincidere con una competenza, un'area o una pagina del sito."
                : "Non modificabile: l'articolo è stato pubblicato e il suo URL è indicizzato."}
            </p>
            <div className="lb" style={{ marginTop: 16 }}>
              Estratto (facoltativo, per gli elenchi del magazine)
            </div>
            <textarea value={a.excerpt ?? ""} onChange={(e) => set("excerpt", e.target.value)} rows={3} style={inputStyle} />
          </div>

          <div className="cd">
            <div className="lb">Testo</div>
            <MarkdownEditor value={a.body_md} onChange={(v) => set("body_md", v)} />
          </div>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <div className="cd">
            <div className="lb">Pubblicazione</div>
            <select value={a.status} onChange={(e) => set("status", e.target.value as Articolo["status"])} style={inputStyle}>
              <option value="draft">Bozza</option>
              <option value="publish">Pubblicato</option>
            </select>
            <div className="lb" style={{ marginTop: 14 }}>
              Data di pubblicazione
            </div>
            <input
              type="datetime-local"
              value={perInput(a.published_at)}
              onChange={(e) => set("published_at", e.target.value ? new Date(e.target.value).toISOString() : null)}
              style={inputStyle}
            />
            <p className="muted" style={{ marginTop: 6 }}>Vuota: alla pubblicazione vale la data di oggi.</p>
            <div className="lb" style={{ marginTop: 14 }}>
              Autore
            </div>
            <select value={a.author_id ?? ""} onChange={(e) => set("author_id", e.target.value || null)} style={inputStyle}>
              <option value="">—</option>
              {autori.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                </option>
              ))}
            </select>
            {mai_pubblicato && (
              <button type="button" className="btn" onClick={elimina} style={{ marginTop: 16, color: "var(--red)" }}>
                Elimina bozza
              </button>
            )}
          </div>

          <div className="cd">
            <div className="lb">Copertina</div>
            {a.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- anteprima di un'immagine remota
              <img src={a.cover_url} alt="" style={{ width: "100%", borderRadius: 8, marginBottom: 10 }} />
            ) : (
              <p className="muted">Nessuna copertina.</p>
            )}
            {esterna && (
              <>
                <p className="muted" style={{ color: "var(--amber, #d97706)", marginBottom: 8 }}>
                  L&apos;immagine sta ancora sul vecchio WordPress, che verrà spento.
                </p>
                <button type="button" className="btn" disabled={lavoro} onClick={() => copertina({ url: a.cover_url! })}>
                  Sposta nello storage
                </button>
              </>
            )}
            <label className="btn" style={{ display: "inline-block", marginTop: 10 }}>
              Carica un&apos;immagine
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const fd = new FormData();
                  fd.append("file", f);
                  copertina(fd);
                }}
              />
            </label>
            <div className="lb" style={{ marginTop: 14 }}>
              Testo alternativo
            </div>
            <input value={a.cover_alt ?? ""} onChange={(e) => set("cover_alt", e.target.value)} style={inputStyle} />
          </div>

          <div className="cd">
            <div className="lb">Categorie</div>
            {categorie.map((c) => (
              <label key={c.id} style={{ display: "flex", gap: 8, fontSize: 13, marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={a.category_ids.includes(c.id)}
                  onChange={(e) =>
                    set("category_ids", e.target.checked ? [...a.category_ids, c.id] : a.category_ids.filter((x) => x !== c.id))
                  }
                />
                {c.name}
              </label>
            ))}
          </div>

          <div className="cd">
            <div className="lb">SEO (facoltativi)</div>
            <input
              value={a.seo_title ?? ""}
              onChange={(e) => set("seo_title", e.target.value)}
              placeholder="Title (vuoto: il titolo dell'articolo)"
              style={inputStyle}
            />
            <textarea
              value={a.meta_description ?? ""}
              onChange={(e) => set("meta_description", e.target.value)}
              placeholder="Meta description"
              rows={3}
              style={{ ...inputStyle, marginTop: 10 }}
            />
          </div>
        </div>
      </div>
    </form>
  );
}
