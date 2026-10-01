-- Aggiunge campi per il dettaglio redazionale delle competenze:
-- descrizione: testo libero per la skill page (importato in WP come post_content/excerpt)
-- faq: array [{domanda, risposta}] per schema markup e blocco FAQ WP

ALTER TABLE agency_skills
  ADD COLUMN IF NOT EXISTS descrizione TEXT,
  ADD COLUMN IF NOT EXISTS faq JSONB NOT NULL DEFAULT '[]'::jsonb;
