@AGENTS.md

# best-agency-brain

Company brain per miglioreagenzia.it. Dashboard interna (3-4 utenti: Owner + Coord + Dev) che orchestra tutti gli agenti AI del progetto e centralizza dati agenzie.

## Struttura
- **Overview**: KPI (agenzie totali/verified, revenue MRR, pos SEO media)
- **Agenzie**: CRUD agenzie, verified queue
- **Agents**: registry + run history + trigger manuale
- **SEO / CRM / Content / Settings**: shell futuri

## Stack
Next.js 16 App Router + Supabase (auth+db) + Tailwind 4 + Vercel Cron. Pattern allineato a the-map-app.

## Agenti previsti
1. Agency Updater (data hygiene, cron giornaliero) — primo attivo
2. Position Checker (SemRush)
3. Verified Checker (brand radar)
4. Verified Mail Flow (Apollo/Snov + Claude)
5. Content Draft Engine
6. International Cloner (mese 6+)

## Workflow
Main-only, no dev branch. Deploy su Vercel.
