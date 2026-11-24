@AGENTS.md

# best-agency-brain

Company brain per miglioreagenzia.it. Dashboard interna (3-4 utenti: Owner + Coord + Dev) che orchestra gli agenti AI del progetto e centralizza i dati delle agenzie.

Multi-tenant: ogni sezione lavora sul dominio selezionato nel DomainSwitcher (miglioreagenzia.it + domini esteri del network). Quasi tutte le API accettano `domain_id`.

## Stack
Next.js 16 App Router + Supabase (auth+db+storage) + Tailwind 4 + Vercel Cron. Pattern allineato a the-map-app.

## Sezioni (`src/app/(dashboard)/`, nav in `src/lib/nav.ts`)
- **Overview**: KPI agenzie
- **Agenzie**: lista con filtri, colonne configurabili e mappa; scheda di dettaglio con modifica in linea dei campi (whitelist in `src/lib/agency-editable.ts`, i campi salvati finiscono in `manual_fields` e l'agency-updater non li sovrascrive); import/export CSV (v1 e v2), stats. Sedi (`agency_sedi`, comune ISTAT da `comuni`): principale + secondarie, estere solo come dato; da qui il DB calcola `agency_areas` e i testi `aree`/`citta`/`regioni` (docs/sedi-progetto.md)
- **Fields**: documentazione dei campi della tabella `agencies` (`src/lib/fields-catalog.ts`)
- **Quality**: coda delle issue aperte (`agency_issues`) prodotte da agency-quality-check, da rivedere a mano
- **Competenze**: lista controllata di skill (slug immutabile, campi SEO, guide, correlate); export CSV
- **Listing**: matrice copertura agenzie e matrice copertura SERP per area × competenza
- **Pricelist**: prezzi dinamici dei listing, `volume × CTR(posizione) × CPC × markup` (`src/lib/pricing.ts`)
- **Radar**: visitatori dei siti del network, IP → azienda, match con le agenzie
- **Agents**: registry, storico run, trigger manuale, schedule per agente
- **Network**: domini esteri del network
- **CRM**: contatti, deal con fasi, attività. Campagne: shell vuota
- **Contenuti**: articoli magazine (Markdown + cover), pagine del sito, categorie, autori; importati da WordPress (`src/lib/content.ts`)
- **SEO**: shell vuota
- **Settings**: backfill competenze e geo. API keys, utenti e config cron ancora da fare

## API (`src/app/api/`)
Una cartella per sezione: `agencies`, `agency-skills`, `agency-issues`, `agents`, `agent-schedules`, `content`, `crm`, `features`, `fields`, `matrice`, `network`, `pricelist`, `radar`, `export`, `cron`. Auth in `src/lib/api-auth.ts`.

## Agenti (`src/lib/agents/`)
Ogni agente ha `config.ts` + `run.ts` + `sources/`; registrati in `registry.ts`, base comune in `framework.ts`.

| id | Frequenza | Funzione |
|---|---|---|
| agency-updater | ogni 60 min (in pausa dal 24/11/2026) | Arricchimento: scrape sito + estrazione LLM, Google Places, VIES, geo |
| agency-scouter | manuale | Trova nuove agenzie (directory, premi, SERP), dedup, inserisce come draft |
| agency-visual-enrichment | ogni 6 ore | Logo, foto team, portfolio → Supabase Storage |
| agency-quality-check | ogni 6 ore (in pausa dal 24/11/2026) | Duplicati, siti morti, dati vuoti; auto-trash blacklist, auto-merge duplicati hard. Unico autore delle issue in Quality |
| agency-serp-position | ogni 6 ore (ogni agenzia ricontrollata dopo 6 giorni) | Posizione di miglioreagenzia.it per "nome agenzia + città" (DataForSEO) |
| matrice-serp-position | ogni 6 ore | Posizione SERP per cella area × competenza con ≥5 agenzie |
| radar-enricher | ogni 15 min | IP → azienda (AbstractAPI + reverse DNS), batch 50 |

Lo `schedule` nei config è indicativo: la fonte di verità è la tabella `agent_schedules`, letta da `/api/cron/dispatch`.

### Agenti futuri
- Verified Checker (brand radar)
- Verified Mail Flow (Apollo/Snov + Claude)
- Content Draft Engine
- International Cloner (mese 6+)

## Cron (`vercel.json`)
- `/api/cron/dispatch`: ogni minuto, avvia gli agenti dovuti secondo `agent_schedules`
- `/api/cron/radar-truncate`: giornaliero 03:00, pulizia dati Radar

## Database
Migrazioni in `supabase/migrations/` numerate in sequenza (`00NN_nome.sql`). Le lancia l'utente dall'SQL Editor, una alla volta; prima si provano su una copia locale (PGlite) con i dati reali.
Il sito legge solo le viste dello schema `site` (ruolo `site_reader`). Per le analisi c'è il ruolo in sola lettura `brain_ro` (`BRAIN_RO_DATABASE_URL` in `.env.local`).
Campi di workflow: `verifica` = profilo verificato, solo per le agenzie con abbonamento a pagamento; `status_curatela` = controllo redazionale della scheda (proposta / verificata / rifiutata).
Lo stato della pulizia dei dati è in `docs/piano-pulizia.md`.

## Workflow
Main-only, no dev branch. Deploy su Vercel.
