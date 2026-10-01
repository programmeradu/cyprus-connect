-- Grant scout now also reads each call's official PDF documents.
-- Clear the read marker once so every open call is re-read with its PDFs
-- (at most 40 calls per daily run, so this spreads over a few days).
update grant_opportunities set rules_extracted_at = null;
