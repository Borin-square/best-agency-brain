# best-agency-brain

Company brain per miglioreagenzia.it. Dashboard interna che centralizza dati agenzie e orchestra tutti gli agenti AI del progetto.

## Setup rapido

```bash
cd best-agency-brain
npm install
cp .env.example .env.local
# compila le variabili in .env.local
npm run dev
```

## Deploy

1. Crea progetto Supabase → copia URL + anon key + service role in `.env.local`
2. Esegui migrations SQL da `supabase/migrations/` (in ordine)
3. Seed manuale utenti in `profiles` via SQL:
   ```sql
   insert into profiles (id, email, full_name, role)
   values ('<uuid da auth.users>', 'you@email.it', 'Nome', 'owner');
   ```
4. Collega repo a Vercel → aggiungi env vars → deploy
5. Vercel Cron parte automaticamente da `vercel.json`

## Struttura

- **`src/app/(dashboard)/`** — pagine dashboard (Overview, Agenzie, Agents, SEO, CRM, Content, Settings)
- **`src/app/api/`** — API routes (cron, trigger manuale, export CSV)
- **`src/lib/agents/`** — framework + registry + singoli agenti (una folder ciascuno)
- **`supabase/migrations/`** — schema SQL versionato

## Aggiungere un nuovo agente

1. Crea `src/lib/agents/<agent-id>/` con `config.ts` + `run.ts` (+ opzionale `sources/`)
2. Registra in `src/lib/agents/registry.ts`
3. Aggiungi cron in `vercel.json`
4. Deploy → visibile in `/agents`
