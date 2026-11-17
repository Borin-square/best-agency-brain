@AGENTS.md

# best-agency-brain

Company brain per miglioreagenzia.it. Dashboard interna (3-4 utenti: Owner + Coord + Dev) che orchestra gli agenti AI del progetto e centralizza i dati delle agenzie.

Multi-tenant: ogni sezione lavora sul dominio selezionato nel DomainSwitcher (miglioreagenzia.it + domini esteri del network). Quasi tutte le API accettano `domain_id`.

## Stack
Next.js 16 App Router + Supabase (auth+db+storage) + Tailwind 4 + Vercel Cron. Pattern allineato a the-map-app.

## Sezioni (`src/app/(dashboard)/`, nav in `src/lib/nav.ts`)
- **Overview**: KPI agenzie
- **Agenzie**: lista con filtri, colonne configurabili e mappa; scheda di dettaglio; import/export CSV (v1 e v2), stats
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
| agency-updater | ogni 30 min | Arricchimento: scrape sito + estrazione LLM, Google Places, VIES, geo |
| agency-scouter | manuale | Trova nuove agenzie (directory, premi, SERP), dedup, inserisce come draft |
| agency-visual-enrichment | ogni ora | Logo, foto team, portfolio → Supabase Storage |
| agency-quality-check | giornaliero 04:00 | Duplicati, siti morti, dati vuoti; auto-trash blacklist, auto-merge duplicati hard |
| agency-serp-position | settimanale | Posizione di miglioreagenzia.it per "nome agenzia + città" (DataForSEO) |
| matrice-serp-position | settimanale | Posizione SERP per cella area × competenza con ≥5 agenzie |
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
Migrazioni in `supabase/migrations/` numerate in sequenza (`00NN_nome.sql`).

## Workflow
Main-only, no dev branch. Deploy su Vercel.
