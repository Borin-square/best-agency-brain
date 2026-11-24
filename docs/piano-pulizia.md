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
- Sezione Sedi nella scheda (`0045`: ricerca comuni, sede principale) e vista `site.agency_sedi`
  per il sito (`0046`).
- Foglio dei controlli manuali per la persona che verifica i dati:
  [Controlli manuali agenzie](https://claude.ai/artifact/1FNx6pBevvkXRFo5vZiihz) (privato
  finché non lo si condivide). Foglio "Controlli": 179 righe (senza sede in Italia, unioni sbagliate,
  doppioni, titoli, competenze, sedi da verificare, 4 unioni automatiche da controllare). Foglio
  "Sedi da completare": 313 sedi con la sola provincia.
- Coda Quality pulita: chiuse a mano 463 segnalazioni "enrichment_failing" dovute al credito OpenAI
  (`superseded`) e 34 su 13 agenzie cestinate per scelta (`trashed`). Da 721 a 224 aperte. Restano
  aperte apposta MAYANprojects e A-Channel (nel foglio) e le 4 unite dall'agente (Brescia Events,
  Digitalificio, Web Zone, WhiteLab Cuneo).

- Ranking degli elenchi spostato nel brain (`0047_ranking`): tabella `ranking_config` (pesi per
  dominio), viste `agency_punteggi` e `site.agency_punteggi`. Il sito ordina con quei punteggi;
  parità verificata (5.644 pagine, zero differenze). Dettagli nel doc del sito, "Ranking dal brain".

## Decisioni del 24/11/2026

- **Lancio del sito nuovo: settimana del 30/11/2026.** Prima del lancio: pulizia del DB, confronto con
  il live per non perdere pagine indicizzate (combo fatte con la whitelist; restano le schede
  agenzia), coda Quality.
- **Scouter dopo il lancio.** Il prossimo scouting è fra qualche settimana: la correzione della
  deduplica (`dedup.ts`) si fa prima di quello, non prima del lancio.
- **`verifica` = profilo verificato a pagamento.** Solo le agenzie con abbonamento attivo, con il badge
  sul sito. Non va usato per dire che i dati sono stati controllati. Oggi è vuoto su tutte.
- **Ranking nel brain**, non nel sito: serve a CRM e newsletter (es. invito a verificare il profilo
  alle agenzie fra le prime 20 di una pagina), al peso della verifica e agli spazi in evidenza.
- **Dopo il lancio, per il CRM:** tabella abbonamenti (inizio, scadenza, deal del CRM; `verifica`
  calcolato da lì e badge che scade da solo), fotografia periodica delle posizioni per pagina,
  disiscrizioni e storico invii, strumento di invio delle campagne.
- **`status_curatela`** (oggi "proposta" su tutte le 1.752): proposta di usarlo come segno di controllo
  redazionale (verificata = controllata da una persona, gli agenti non toccano i campi; rifiutata =
  motivo del cestino, lo scouter non la ripropone). Da confermare.

## Per andare online (lancio previsto la settimana del 30/11/2026)

Dove siamo al 24/11 sera: sedi fatte (DB, scheda, vista per il sito), ranking nel brain, combo
indicizzate protette dalla whitelist, coda Quality pulita (224 aperte), foglio dei controlli manuali
in mano alla persona che verifica i dati. Agenti updater e quality-check in pausa, OpenAI spento.

Manca, in ordine:
1. **Ambiente di staging**: mai discusso. Prossimo argomento: dove gira il sito nuovo prima del
   lancio, con quali dati, come si prova senza toccare il live e il DB di produzione.
2. **Foglio dei controlli su Google Sheets**: la persona che verifica non può modificare il foglio
   su claude.ai (solo lettura). Da creare il Google Sheet con le due schede e condividerlo come Editor.
3. **Confronto con il live per le schede agenzia**: ogni URL `/agenzia/...` del live → 200, 301 o 410
   voluto sul nuovo, partendo da quelle con impression in Search Console. Le combo sono già coperte.
4. **Pagina Quality**: colonna con lo stato dell'agenzia, filtro di base sulle pubblicate.
5. **`status_curatela`**: da confermare l'uso come "controllata da una persona" (tendina, data
   automatica, istruzione nel foglio).
6. **Risultati dei controlli manuali**: pubblicate senza sede in Italia (41 senza sedi, 16 solo
   estere), unioni sbagliate da ripubblicare, doppioni, sedi da completare. Poi il blocco "niente
   publish senza sede italiana".
7. **Punti aperti del doc del sito** (`miglioreagenzia-next/docs/rebuild.md`, "Criticità e dubbi"):
   competenze del live senza pagina (301 o 404), "In evidenza" (11 posizioni di Square Marketing e
   Virality Solution, alcune dove non hanno sede: decisione commerciale), etichette delle competenze.
8. Verificare `0037_testi_seo_come_live.sql` (vedi "Da verificare subito").

Dopo il lancio: scouter (deduplica), regole nuove di quality-check e updater prima di riaccenderli,
rinomina "Monza e della Brianza" → "Monza e Brianza" (4-8 settimane), CRM (abbonamenti, posizioni,
newsletter).

## Da fare nel brain

- Elenco delle combo in whitelist sotto le 5 agenzie (oggi 5: `google-ads/ferrara` con 1 agenzia).
- Pagina Quality: colonna con lo stato dell'agenzia e filtro di base sulle pubblicate.
- Scouter (dopo il lancio): la deduplica legge solo 1.000 agenzie (`dedup.ts`); non lanciarlo finché
  non è corretto.
- Quality-check, prima di riaccenderlo:
  - niente azioni automatiche sulle pubblicate, solo segnalazioni; nell'unione vince la pubblicata,
    301 verso la vincente;
  - gli errori di sistema (credito OpenAI, timeout) non diventano segnalazioni;
  - una segnalazione chiusa dall'agente (`fixed`) o per il credito (`superseded`) si riapre se il
    problema torna: oggi `upsertIssue` non riapre mai una riga chiusa; restano chiuse solo quelle
    decise da una persona (`resolved_by` valorizzato o `ignored`/`trashed` a mano);
  - le segnalazioni delle agenzie che vanno nel cestino si chiudono da sole.
- Updater, scouter, import CSV e backfill-geo da adattare alle sedi (sedi-progetto.md §5).
- Le pubblicate ancora senza sede in Italia (al 24/11: 41 senza sedi, 16 solo estere): quando la
  persona che verifica le ha sistemate, attivare il blocco "niente publish senza sede italiana".
- Updater: competenze e descrizioni solo se vuote sulle pubblicate; non svuotare mai le competenze.

## Da verificare subito

- `0037_testi_seo_come_live.sql`: nel doc del sito risulta "da lanciare". È stata eseguita sul DB?
- `0038`–`0040` sono nuove rispetto al doc del sito: annotarle anche lì quando toccano lo schema `site`.
