"use client";

import { useEffect, useRef } from "react";

export interface MapPoint {
  id: string;
  nome: string;
  citta: string | null;
  lat: number;
  lng: number;
  verified: boolean | null;
}

interface Props {
  points: MapPoint[];
  height?: number;
}

export function AgenzieMap({ points, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (points.length === 0) return;

    let destroyed = false;

    // Carica CSS Leaflet una sola volta
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    import("leaflet").then(({ default: L }) => {
      if (destroyed || !containerRef.current) return;

      // Se la mappa esiste già (hot-reload / re-render), la distrugge prima
      if (mapRef.current) {
        (mapRef.current as ReturnType<typeof L.map>).remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current!, { zoomControl: true, scrollWheelZoom: false });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const markers = points.map((p) =>
        L.circleMarker([p.lat, p.lng], {
          radius: 7,
          fillColor: p.verified ? "#22c55e" : "#3b82f6",
          color: p.verified ? "#15803d" : "#1d4ed8",
          weight: 1.5,
          fillOpacity: 0.85,
        })
          .bindPopup(
            `<strong style="font-size:13px">${p.nome}</strong>${p.citta ? `<br><span style="color:#666;font-size:12px">${p.citta}</span>` : ""}${p.verified ? '<br><span style="color:#16a34a;font-size:11px">✓ Verificata</span>' : ""}`,
          )
          .addTo(map),
      );

      // Fit bounds su tutti i marker
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        (mapRef.current as { remove: () => void }).remove();
        mapRef.current = null;
      }
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <div
        style={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg3)",
          border: "1px solid var(--bd)",
          borderRadius: 8,
          color: "var(--fg3)",
          fontSize: 13,
        }}
      >
        Nessuna agenzia con coordinate disponibile. Avvia l&apos;agency updater per arricchire i dati.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height, borderRadius: 8, overflow: "hidden", border: "1px solid var(--bd)" }}
    />
  );
}
