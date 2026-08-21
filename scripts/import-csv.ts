// One-shot import: legge CSV WP All Import → upsert in agencies.
// (Alternative: usa il bottone Import CSV nella tab Agenzie.)
//
// Uso: npx tsx scripts/import-csv.ts /path/to/Agenzie-Export.csv
// Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { parseCsv, mapAgencyRow } from "../src/lib/agency-csv";

const CSV_PATH = process.argv[2];
if (!CSV_PATH) {
  console.error("Usage: tsx scripts/import-csv.ts <path-to-csv>");
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const csvPath = path.resolve(CSV_PATH);
  console.log(`Reading ${csvPath}…`);
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(raw);
  console.log(`Parsed ${rows.length} rows`);

  const mapped = rows.map(mapAgencyRow).filter((r): r is Record<string, unknown> => r !== null);
  console.log(`Mapped ${mapped.length} valid rows (${rows.length - mapped.length} skipped)`);

  const CHUNK = 200;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < mapped.length; i += CHUNK) {
    const chunk = mapped.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from("agencies")
      .upsert(chunk, { onConflict: "wp_id", ignoreDuplicates: false, count: "exact" });

    if (error) {
      console.error(`Chunk ${i / CHUNK + 1} error:`, error.message);
      errors += chunk.length;
    } else {
      imported += count ?? chunk.length;
      console.log(`  ✓ Chunk ${i / CHUNK + 1}: ${chunk.length} rows (running total: ${imported})`);
    }
  }

  console.log(`\nDone. Imported/updated ${imported}, errors ${errors}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
