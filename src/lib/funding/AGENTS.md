# Funding matching

- Funding calls are shown per workspace only when Grant scout (`grants`) rates them strong or one answer away: AI reads each call's rules once — page text plus official linked PDFs whose text is extracted by code (`call-documents.server.ts`) — with quotes verified word for word and tagged with their source (`src/lib/funding/extract.server.ts`), fixed code decides fit (`src/lib/funding/match.ts`), missing facts become `question` tasks answered through the company record. Why: no duplicate public listings, reproducible verdicts, no guessed eligibility.
