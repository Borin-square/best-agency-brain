# Piano: pulizia del database e logiche del brain

Scritto il 24/11/2026 dalla sessione del sito nuovo (`~/Sites/miglioreagenzia-next`). Obiettivo:
prendere in mano le logiche del brain e pulire i dati delle agenzie **prima** di chiudere le criticità
del sito e andare online.

## Contesto da sapere

- Il sito nuovo (Next.js) legge solo dallo schema `site` (viste in sola lettura, ruolo `site_reader`).
  Ogni modifica a una vista `site.*` o alle colonne che le alimentano tocca il sito: va segnalata.
- Stato del sito, decisioni e criticità: `~/Sites/miglioreagenzia-next/docs/rebuild.md`.
- Il brain l'ha costruito chi non programma, guidando Claude: schema e codice **non revisionati**. Il
  DB reale diverge dalle migrazioni: verificare con query, non dedurre dai file.
- Le migrazioni le lancia l'utente dall'SQL Editor di Supabase: un passo alla volta, spiegando a cosa
  serve ogni query. Prima di dargliele vanno testate (PGlite nello scratchpad, con le colonne reali).
- Comportamenti già in piedi che la pulizia non deve rompere:
  - `agencies.public_slug` è immutabile (URL delle schede sul sito);
  - `agency_skills.slug` è immutabile (`0033`);
  - `agency_redirects` si aggiorna da sola: scheda eliminata o tolta da publish → 410; tornata publish
    → il 410 sparisce;
  - `combo_whitelist` è append-only (`0031`): competenze e aree in whitelist non si cancellano;
  - `aree` (testo) → `agency_areas` tramite trigger (`0028`).

## Scaletta

1. **Capire prima di pulire (sola lettura).** Mappa di chi scrive cosa su `agencies`: i 7 agenti
   (`src/lib/agents/`), quali campi tocca ognuno, frequenza, cosa protegge `manual_fields` (`0040`,
   `src/lib/agency-editable.ts`), cosa fanno le API server-side. Senza questo una pulizia a mano può
   essere annullata dall'`agency-updater` mezz'ora dopo. Risultato: una sezione in questo file.
2. **Sicurezza di base.** RLS è attiva senza policy, ma `anon` ha ancora tutti i grant su `agencies`
   (INSERT, UPDATE, DELETE, TRUNCATE…): revocarli dopo aver verificato che il brain non ne dipenda (la
   pagina `/agenzie` leggeva dal browser con anon key + sessione). Giro su RLS e sull'uso della service
   key.
3. **Controlli in scrittura, prima della pulizia.** Aree e competenze accettate solo se a vocabolario
   (`areas`, `agency_skills`), negli agenti e nelle API. Portare nel brain la mappa dei sinonimi
   (`ecommerce` → `e-commerce`, oggi solo in `tools/normalizza-vocabolario.py` del tema WordPress).
   Altrimenti gli agenti risporcano.
4. **Pulizia**, partendo da ciò che si vede sul sito:
   - competenze fuori vocabolario (~55 valori: etichette al posto degli slug come "SEO", "WordPress",
     "Google Ads", "Shopify"; settori nel campo sbagliato come "Food & Beverage");
   - etichette delle competenze: Ecommerce → E-commerce, Magento, WordPress, WooCommerce, PrestaShop;
   - aree sbagliate: Zero Digital E (`Lombardia > Abruzzo`), Evemilano (`Svizzera > Lugano`), e
     `agency_areas_da_rivedere`;
   - agenzie con coordinate a Londra e Parigi: dati giusti o errori?
   - doppioni;
   - posizioni "In evidenza" (`agency_features`, 11): quali sono attive e giuste (sono a pagamento).
5. **`agency-quality-check`.** Ogni notte cestina da solo le agenzie in blacklist e unisce da solo i
   doppioni certi. Sul sito ogni scheda tolta diventa 410; un doppione unito dovrebbe invece dare 301
   verso l'agenzia buona (`agency_redirects.target_agency_id`), e il trigger oggi mette 410. Da
   sistemare: l'auto-merge deve scrivere il 301.

## Decisione da prendere prima della pulizia

La pulizia farà scendere alcune combo competenza × città sotto le 5 agenzie: sul sito passerebbero da
200 a 404, e il live posiziona bene. Proposta: mettere subito in `combo_whitelist` le combo oggi
pubbliche sul live (722 il 17/11, elenco da `mg_combo_pubbliche()` via WP-CLI su `ssh mg-live`),
dopo aver guardato in Search Console quante hanno impression (connettore Markifact, connessione
`manuel@squaremarketing.it`).

## Fatto il 24/11/2026

- Connessione in sola lettura al DB (`brain_ro`, `.env.local`), per le analisi.
- `agency-updater` e `agency-quality-check` in pausa (`agent_schedules.enabled = false`). OpenAI è
  senza credito dal 20/10: resta spento finché la pulizia non è finita.
- Studio Cappello, Feelstudio, Gust Comunicazione ripubblicate con slug nuovo e 301
  ([unioni-da-ricontrollare.md](unioni-da-ricontrollare.md)).
- 26 draft doppioni dello scouter cestinate ([doppioni-scouter.md](doppioni-scouter.md)).
- `combo_whitelist` da 171 a 407 (`0041`): combo del live con impression GSC.
- Analisi aree: [aree-da-sistemare.md](aree-da-sistemare.md). Deciso il modello delle **sedi**
  (comune ISTAT, principale + secondarie, estere solo come dato): migrazioni `0042`-`0044` lanciate,
  1.616 sedi, aree del sito invariate (tranne Zero Digitale). Restano scheda Sedi e agenti
  ([sedi-progetto.md](sedi-progetto.md)).
- Zero Digitale (ex "Zero Digital E"): nuovo URL `zero-digitale` con 301, due sedi.

## Da fare nel brain

- Elenco delle combo in whitelist sotto le 5 agenzie (oggi 5: `google-ads/ferrara` con 1 agenzia).
- Lista dei controlli per la persona che verifica i dati (dopo aver saputo cosa è già stato fatto a
  mano).
- Scouter: la deduplica legge solo 1.000 agenzie (`dedup.ts`); non lanciarlo finché non è corretto.
- Quality-check: niente azioni automatiche sulle pubblicate, nell'unione vince la pubblicata, 301
  verso la vincente.
- Updater: competenze e descrizioni solo se vuote sulle pubblicate; non svuotare mai le competenze.

## Da verificare subito

- `0037_testi_seo_come_live.sql`: nel doc del sito risulta "da lanciare". È stata eseguita sul DB?
- `0038`–`0040` sono nuove rispetto al doc del sito: annotarle anche lì quando toccano lo schema `site`.
