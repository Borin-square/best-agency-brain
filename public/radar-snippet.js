/**
 * Radar snippet — best-agency-brain
 *
 * Da incollare nel footer del sito trackato (es. miglioreagenzia.it).
 *
 * Cosa fa:
 *  - Al load della pagina invia { url, referrer } all'endpoint /api/radar/track
 *    del brain. L'IP del visitatore viene letto lato server dagli header.
 *  - Nessun cookie, nessun fingerprinting → non richiede consenso Iubenda.
 *  - Ignora bot noti via user-agent (best-effort).
 *  - Ignora anche errori di rete: non blocca mai la pagina.
 *
 * Installazione WordPress:
 *   Aggiungere al footer o via plugin "Insert Headers and Footers":
 *   <script src="https://<BRAIN-DOMAIN>/radar-snippet.js" async></script>
 *
 * Configurazione opzionale (window.__RADAR):
 *   window.__RADAR = { endpoint: "https://<BRAIN-DOMAIN>/api/radar/track" };
 *   (default: stesso host dello script)
 */
(function () {
  try {
    var cfg = (typeof window !== "undefined" && window.__RADAR) || {};
    var scriptEl = document.currentScript;
    var defaultBase = scriptEl && scriptEl.src
      ? new URL(scriptEl.src).origin
      : window.location.origin;
    var endpoint = cfg.endpoint || defaultBase + "/api/radar/track";

    // Bot skip (best-effort)
    var ua = (navigator.userAgent || "").toLowerCase();
    var botRegex = /(bot|crawler|spider|slurp|bingpreview|google-inspection|headless|lighthouse|pagespeed|pingdom|uptimerobot|dataforseo|semrush|ahrefs|screaming frog)/i;
    if (botRegex.test(ua)) return;

    var payload = {
      url: window.location.href,
      referrer: document.referrer || null,
    };

    // Prefer sendBeacon (fire-and-forget, non blocca navigazione)
    var body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  } catch (e) {
    // silent
  }
})();
