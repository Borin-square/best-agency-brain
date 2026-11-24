# Sedi delle agenzie: progetto

Scritto il 24/11/2026, da rivedere prima di scrivere le migrazioni. Decisioni già prese con l'utente:

- ogni agenzia ha una o più **sedi**: una principale, le altre secondarie;
- per una sede italiana si sceglie il **comune** da un elenco fisso; provincia e regione derivano dal
  comune e non si scrivono mai;
- le **sedi estere** sono solo un dato da mostrare nella scheda: non danno aree e non entrano negli
  archivi;
- il sito mostra solo agenzie con **almeno una sede in Italia**;
- le sedi secondarie **contano** negli archivi di città e regione e nelle combo; non sono a pagamento.

## 1. Cosa c'è oggi

- `agencies.aree` (testo libero, es. `Lombardia>Milano`) → trigger → `agency_areas` (agenzia ↔
  provincia o regione) → vista `site.agency_areas`, che è l'unica cosa che il sito legge per le aree.
- `agencies.citta` e `agencies.regioni`: testi usati solo nel brain (filtri, matrice, pricelist,
  featured, agenti).
- Chi scrive `aree`: agency-updater (indirizzo Google), scheda agenzia (testo libero), import CSV.

Numeri (agenzie non cestinate):

| | Pubblicate | Draft |
|---|---|---|
| Una provincia | 1.419 | 115 |
| Più province | 2 (Lavder, Easy Digital Agency) | 2 |
| Solo regione | 1 (Zero Digital E) | 0 |
| Nessuna area | 73 | 68 |

Sulle pubblicate il comune si ricava dall'indirizzo (Google o sito) per 1.134: in 1.110 coincide con
la provincia di oggi, in 24 no (vedi §6).

## 2. I comuni

Fonte: elenco ISTAT dei comuni italiani
(`https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.csv`, scaricato il
24/11/2026): **7.896 comuni in 107 province**, le stesse 107 di `areas` (Sud Sardegna compresa). Le
province si abbinano una a una per sigla; Aosta, Bolzano e Trento a mano (nel file hanno il nome
bilingue).

```sql
create table public.comuni (
  codice     text primary key,      -- codice ISTAT alfanumerico, es. '001272'
  nome       text not null,         -- 'Torino'
  nome_altro text,                  -- 'Bozen' (comuni bilingui)
  sigla      text not null,         -- sigla della provincia, 'TO'
  capoluogo  boolean not null default false
);
create index on public.comuni (sigla);
-- per l'autocompletamento: ricerca per nome senza accenti
create index on public.comuni (public.normalizza_luogo(nome));

alter table public.areas add column sigla text;  -- solo le città (province): 'TO'
create unique index on public.areas (domain_id, sigla) where sigla is not null;
```

Il comune non punta direttamente a un'area perché `areas` è per dominio (multi-tenant): l'area di una
sede si trova con `areas.domain_id = agenzia.domain_id and areas.sigla = comune.sigla`.

Aggiornamenti: l'elenco ISTAT cambia raramente (fusioni di comuni, 1-2 volte l'anno). Un comune
soppresso resta in tabella con `soppresso = true` (colonna da aggiungere quando servirà), così le sedi
già salvate non si rompono.

## 3. Le sedi

```sql
create table public.agency_sedi (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  principale    boolean not null default false,
  paese         text not null default 'IT',        -- ISO 3166-1 alpha-2
  comune_codice text references public.comuni(codice),
  citta_estera  text,                               -- solo per paese <> 'IT'
  area_id       uuid references public.areas(id),   -- calcolata dal trigger, non si scrive
  indirizzo     text,                               -- facoltativo, per la scheda
  fonte         text check (fonte in ('sito', 'google', 'agenzia', 'verifica', 'migrazione')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  check (
    (paese = 'IT'  and citta_estera is null and area_id is not null)
 or (paese <> 'IT' and comune_codice is null and area_id is null and citta_estera is not null)
  )
);
-- al massimo una principale per agenzia
create unique index on public.agency_sedi (agency_id) where principale;
-- lo stesso comune una volta sola per agenzia
create unique index on public.agency_sedi (agency_id, comune_codice) where comune_codice is not null;
```

**Trigger `agency_sedi_area` (before insert/update)**: se `comune_codice` c'è, `area_id` diventa la
provincia del comune, qualunque cosa sia stata scritta. Se il comune non ha una provincia nel dominio
dell'agenzia: errore. Così `Lombardia > Abruzzo` non può più esistere.

**Sede italiana senza comune** (`comune_codice` vuoto, `area_id` scritto a mano): ammessa **solo**
per i dati migrati di cui oggi si conosce la provincia ma non il comune (292 pubblicate). Nella
scheda compare come "da completare", e salvandola il brain chiede il comune. Una vista
`agency_sedi_da_completare` le elenca per la persona che verifica i dati.

**Trigger `agency_sedi_aree` (after insert/update/delete)**: ricostruisce `agency_areas`
dell'agenzia = le province delle sue sedi italiane (le regioni non servono: il sito le ricava già
dalla provincia). Sostituisce il trigger attuale che legge il testo `aree`.

**Garanzia "almeno una sede in Italia"**: un trigger su `agencies` impedisce di mettere in `publish`
un'agenzia senza sede italiana, e uno su `agency_sedi` impedisce di cancellare l'ultima sede italiana
di un'agenzia pubblicata. La regola sta nel DB: il sito non deve filtrare niente e non esistono
schede pubblicate che il sito nasconde (che darebbero 404 invece del 410 corretto). Si attivano
**dopo** aver sistemato le 73 pubblicate senza sede.

## 4. Compatibilità: `aree`, `citta`, `regioni`

Restano sulla tabella `agencies` come **campi calcolati** dalle sedi (scritti dal trigger delle
sedi), perché li usano ancora molte parti del brain: lista e filtri agenzie, matrice, pricelist,
featured, quality-check, export CSV.

- `aree` = `Regione>Provincia` di ogni sede italiana, la principale per prima, separate da virgola
- `citta` = slug della provincia della sede principale (come oggi: es. `milano`)
- `regioni` = slug della regione della sede principale

Escono dai campi modificabili della scheda (`src/lib/agency-editable.ts`) e dal lucchetto
`manual_fields`. Poi, una sezione alla volta, il brain passa a leggere `agency_sedi`/`agency_areas`;
quando nessuno li legge più si tolgono.

## 5. Cosa cambia nel codice del brain

| Dove | Oggi | Dopo |
|---|---|---|
| Scheda agenzia | `aree`, `citta`, `regioni` testo libero | Sezione **Sedi**: elenco, aggiungi (paese → per l'Italia comune con suggerimenti "Correggio · Reggio Emilia · Emilia-Romagna", per l'estero città libera), principale, indirizzo, fonte |
| API | — | `/api/agencies/[id]/sedi` (GET/POST/PATCH/DELETE), `/api/comuni?q=` (autocompletamento) |
| agency-updater | Riscrive `aree`/`citta`/`regioni` dall'indirizzo Google | Non tocca le sedi. Se l'agenzia non ne ha nessuna e Google dà un comune riconoscibile, crea la sede principale con `fonte = 'google'` |
| agency-scouter | Scrive `citta` (comune in minuscolo) | Nessun dato geografico: la draft riceve la sede da chi la verifica |
| Import CSV | Scrive `aree` | Colonna Aree ignorata (o convertita in sede se riconosciuta: da decidere) |
| `/api/agencies/backfill-geo` | Riempie `aree` dagli indirizzi | Da togliere |
| Lista agenzie, matrice, pricelist, featured | Leggono `aree`/`citta` | Invariati finché esistono i campi calcolati; poi `agency_areas` |
| Fields (`fields-catalog.ts`) | Documenta `aree`/`citta`/`regioni` come modificabili | Documenta le sedi; i tre campi come calcolati |

## 6. Migrazione dei dati di oggi

**Principio: la migrazione non cambia niente di quello che il sito mostra.** Dopo la migrazione
`agency_areas` deve essere identica a prima, riga per riga; la migrazione lo verifica da sola e, se
c'è anche una sola differenza, annulla tutto. Le correzioni (aree sbagliate, sedi da aggiungere) sono
passi successivi, voluti e visibili.

Per ogni agenzia non cestinata:

1. **Una provincia** (1.534): una sede principale in quella provincia. Comune ricavato
   dall'indirizzo se ricade **nella stessa provincia**; altrimenti senza comune ("da completare").
2. **Più province** (Lavder, Easy Digital Agency + 2 draft): una sede per provincia; principale
   quella dell'indirizzo, se coincide con una delle due, altrimenti la prima del testo.
3. **Solo regione** (Zero Digital E): deciso con l'utente il 24/11. Il nome vero è **Zero
   Digitale** e ha due sedi: principale Viale Brianza 181, 20092 Cinisello Balsamo (MI, ISTAT
   `015077`), secondaria Via Sant'Angelo 9, 64020 Castellalto (TE, ISTAT `067011`). È l'unica
   eccezione voluta al principio "agency_areas identica": passa da `lombardia, abruzzo` (regioni) a
   `milano, teramo`. La draft doppione "Agenzia Social Media Teramo" (`afcbeba7…`) va nel cestino.
   Il `public_slug` è `zero-digital-e`: tenerlo o passare a `zero-digitale` con 301, da decidere.
4. **Nessuna area** (73 pubblicate, 68 draft): nessuna sede. Le 13 estere ricevono la sede estera
   (Svizzera 9, Francia 2, San Marino 1, Stati Uniti 1, Messico 1). Restano senza sede italiana:
   vanno sistemate prima di attivare la garanzia del §3 (le 23 con indirizzo leggibile in
   [aree-da-sistemare.md](aree-da-sistemare.md) ricevono la sede subito dopo la migrazione).

**Discordanze da rivedere** (comune dell'indirizzo in un'altra provincia rispetto all'area di oggi):
la migrazione tiene l'area di oggi (deciso con l'utente il 24/11); **si controllano a mano dopo**,
una per una. Può essere una sede secondaria da aggiungere, un'area sbagliata o un indirizzo
sbagliato:

| Agenzia | Area oggi | Comune dall'indirizzo |
|---|---|---|
| Carminati | milano | Bergamo (BG) |
| Video Podcast | milano | Roma (RM) |
| DigIT Export | monza-e-della-brianza | Milano (MI) |
| Feelstudio | venezia | Milano (MI) |
| Pura | bergamo | Sondrio (SO) |
| Dedalux | catania | Bagheria (PA) |
| Krea | treviso | Belpasso (CT) |
| Siamocreativi | monza-e-della-brianza | Gallarate (VA) |
| OIS | milano | Legnago (VR) |
| TETRIS | firenze | Prato (PO) |
| 4T Marketing | milano | Cadorago (CO) |
| Adacto | milano *(bloccata a mano)* | Empoli (FI) |
| Agenzia Pubblicità Novara *(titolo con codifica rotta)* | milano | Cressa (NO) |
| Fanzago | milano | Clusone (BG) |
| Conceptio | lucca | Novara (NO) |
| E Venti | monza-e-della-brianza | Bergamo (BG) |
| T Studio | monza-e-della-brianza | Carimate (CO) |
| Conversi ADV | pescara | Morro d'Oro (TE) |
| Seo Business | venezia | Torino (TO) |

## 7. Cosa cambia per il sito

- `site.agency_areas`: **stessa forma**, alimentata dalle sedi. Archivi e combo non cambiano codice.
- Nuova vista `site.agency_sedi` (solo agenzie pubblicate, migrazione `0046`): `agency_id`,
  `sede_id`, `ordine` (1 = principale, poi le italiane per comune, poi le estere), `principale`,
  `paese`, `completa`, `comune`, `sigla`, `provincia_slug`, `provincia`, `regione_slug`, `regione`,
  `citta_estera`, `indirizzo`, `etichetta` ("Cinisello Balsamo (MI)", "Provincia di Padova",
  "Lugano"). Le sedi da completare (`completa = false`) hanno solo provincia e regione, senza
  indirizzo. Il nome del paese delle sedi estere lo ricava il sito dal codice ISO. Serve per la
  scheda e per il JSON-LD (un'organizzazione con più indirizzi).
- Nessun filtro "almeno una sede in Italia" nel sito: lo garantisce il DB (§3).
- Da annotare nel doc del sito quando le viste sono pronte.

## 8. Ordine di lavoro

**Stato al 24/11/2026:** fatti i passi 1-4. `0042` (7.896 comuni, sigla sulle 107 province),
`0043` (tabella e regole), `0044` (1.616 sedi su 1.611 agenzie: 1.268 con comune, 334 da completare,
14 estere). Verificato su `site.agency_areas`: 1.422 agenzie pubblicate prima e dopo, unica
differenza Zero Digitale (da `abruzzo, lombardia` a `milano, teramo`). Il trigger su `aree` è
tolto: **da qui in poi modificare `aree`/`citta`/`regioni` dalla scheda non ha effetto** finché non
c'è la sezione Sedi (passo 5).

| # | Cosa | Dove | Effetto sul sito |
|---|---|---|---|
| 1 | Decidere Zero Digital E | utente | — |
| 2 | `0042_comuni`: tabella comuni (7.896 righe, divisa in più file per l'SQL Editor) + `areas.sigla` | DB | nessuno |
| 3 | `0043_agency_sedi`: tabella, vincoli, trigger area; trigger `agency_areas` **non ancora attivo** | DB | nessuno |
| 4 | `0044_migra_sedi`: riempie le sedi, ricostruisce `agency_areas` dalle sedi, verifica che sia identica, poi sostituisce il trigger su `aree` con quello sulle sedi e rende `aree`/`citta`/`regioni` calcolati | DB | nessuno (verificato) |
| 5 | Scheda: sezione Sedi, API, autocompletamento comuni; `aree`/`citta`/`regioni` fuori dai campi modificabili | brain | nessuno |
| 6 | Updater, scouter, import CSV, backfill-geo come al §5 | brain | nessuno (agenti in pausa) |
| 7 | Sedi per le 23 con indirizzo leggibile; elenco discordanze e "da completare" alla persona che verifica | dati | le 23 entrano negli archivi |
| 8 | Le pubblicate ancora senza sede italiana escono da `publish` (410); poi si attiva la garanzia del §3 | dati + DB | 410 su quelle schede |
| 9 | Vista `site.agency_sedi` (`0046`, pronta); scheda e JSON-LD sul sito | DB + sito | sedi visibili |

Ogni migrazione si prova prima su una copia locale (PGlite) con le colonne e i dati reali, e si lancia
dall'SQL Editor una alla volta.

## Decisioni del 24/11/2026

- Scheda del sito: per ogni sede l'indirizzo completo quando c'è, altrimenti solo il comune.
- Import CSV: la colonna Aree, se si riconosce la provincia, diventa una sede "da completare";
  altrimenti si ignora e il risultato dell'import lo segnala.
- Coordinate: restano sull'agenzia (sede principale), un segnaposto per agenzia sulla mappa. Un
  segnaposto per sede si potrà aggiungere dopo.
- Zero Digitale: nuovo URL `zero-digitale` con 301 da `zero-digital-e` (52 impression in 16 mesi,
  0 click).
