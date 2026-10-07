# PDF rules

- Customer-facing PDFs (Board Summary, reports, CBAM) are typeset in the browser with Typst (templates in `public/pdf-typst/`, renderer `src/lib/pdf/typst-render.ts`); each download is recorded in `document_fingerprints` and checked publicly at `/verify` via `document-verify.server.ts`. Why: print-grade layout, and a printed fingerprint anyone can check without seeing workspace data.
