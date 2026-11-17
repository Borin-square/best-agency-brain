"use client";

// Schede della sezione Contenuti.

import Link from "next/link";
import { usePathname } from "next/navigation";

const VOCI = [
  { href: "/content", etichetta: "Articoli" },
  { href: "/content/pagine", etichetta: "Pagine" },
  { href: "/content/categorie", etichetta: "Categorie" },
];

export function ContentNav() {
  const percorso = usePathname();
  const attiva = (href: string) =>
    href === "/content" ? percorso === "/content" || percorso.startsWith("/content/articoli") : percorso.startsWith(href);
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
      {VOCI.map((v) => (
        <Link key={v.href} href={v.href} className={`btn${attiva(v.href) ? " btn-primary" : ""}`} style={{ fontSize: 12 }}>
          {v.etichetta}
        </Link>
      ))}
    </div>
  );
}
