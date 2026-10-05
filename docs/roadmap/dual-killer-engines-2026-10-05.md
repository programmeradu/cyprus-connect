# The Dual Killer Super-Engines for Vuneli
*Deep Technical Architecture, Open-Source Tools, and Implementation Blueprints for the Two Most Lucrative Features in the QA Report*

---

# ENGINE 1: THE BANK ESG QUESTIONNAIRE AUTO-PACK
*Turning Commercial Bank Borrower Compliance into an Automated Green Loan Pipeline*

### The Problem in Cyprus
Under ECB (European Central Bank) supervision guidelines, **Bank of Cyprus** and **Hellenic Bank** must report their Scope 3 Category 15 financed emissions. To do this, their corporate credit departments force every business borrower to complete an annual **ESG Questionnaire** (covering energy consumption, fleet fuel, solar PV capacity, environmental fines, and decarbonization targets).
- For an SME (hotel in Paphos, logistics operator in Limassol, manufacturer in Dhali), this questionnaire is terrifying. If they fail to answer or provide unverified estimates, the bank increases their risk margin (adding 25 to 75 basis points to loan interest rates) or rejects credit facility renewals.
- The SME finance officer doesn't know how to map raw EAC electric bills to the bank's specific questions.

---

### The 5 Super-Tools Powering the Bank ESG Auto-Pack

#### 1. Inbound Ingestion & Mapping: Open-LME / OntoESG
- **The Superpower:** An open semantic knowledge graph mapping banking questionnaires to the **EBA (European Banking Authority) ESG ITS Reporting Templates**.
- **How It Works:** Rather than writing hardcoded question-by-question scripts, OntoESG maps every standard question from Bank of Cyprus ("Annual Grid Electricity Consumption (kWh)", "Fuel Spend (EUR)", "On-Site Renewables (kWp)") into standardized semantic tokens.
- **Result:** Vuneli instantly knows which database column satisfies which bank question across both Bank of Cyprus and Hellenic Bank templates.

#### 2. Exact Borrower Loan Book Matching: Open Banking PSD2 Berlin Group APIs
- **The Superpower:** Direct read-only account integration via the **Bank of Cyprus B2B API Store** (`developer.bankofcyprus.com`).
- **How It Works:** Matches the borrower's loan account number and legal entity identifier (HE number / TIC) directly with bank records.
- **Result:** When Vuneli compiles the pack, it attaches the verified loan facility reference number, so the credit risk officer's system can ingest the payload automatically without manual data entry.

#### 3. Deterministic Source Citation: CitationGraph (Provenance Trees)
- **The Superpower:** A cryptographic citation engine linking every populated field to a verified document byte-range.
- **How It Works:** When the bank questionnaire asks *"Total Scope 2 Market-Based Emissions"*, the answer is not just a naked number like `14.2 tCO2e`. It compiles an interactive footnote:
  ```json
  {
    "value": 14.24,
    "unit": "tCO2e",
    "methodology": "GHG Protocol Scope 2 Market-Based",
    "sources": [
      {
        "doc_id": "bill_eac_2024_06",
        "file_sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        "invoice_number": "EAC-8849201",
        "billing_period": "2024-05-01 to 2024-06-30",
        "meter_kwh": 1840,
        "grid_factor": 0.584,
        "factor_authority": "EAC TSO 2024 Report"
      }
    ]
  }
  ```
- **Result:** The bank credit analyst clicks the footnote and sees the exact bill highlighted. Audit risk drops to zero.

#### 4. Computable Green Loan Covenants: Accord Project (`accordproject.org`)
- **The Superpower:** Open-source computable smart legal contract engine.
- **How It Works:** Encodes the bank's green lending margin rules (e.g., *"Borrower qualifies for a 35 basis point margin reduction if verified building energy intensity is below 120 kWh/m2/yr and Scope 1+2 emissions decrease by >8% year-over-year"*).
- **Result:** Vuneli outputs an executive memorandum titled: **"Green Lending Margin Eligibility Certification"**, proving to the bank loan committee that the client qualifies for lower borrowing rates.

#### 5. Institutional Bank-Ready Export: Typst Rust Typesetting Compiler (`typst.app`)
- **The Superpower:** Rust-based typesetting engine compiling 30-page audit packs in **20 milliseconds**.
- **How It Works:** Unlike headless Chrome (Puppeteer) which takes 8 seconds and breaks table borders, Typst outputs pixel-perfect, tamper-stamped PDF packages formatted according to institutional banking guidelines, complete with table of contents, high-res charts, and digital signatures.

---

# ENGINE 2: THE REVERSE QUESTIONNAIRE INBOX
*Forward Any 40-Page ESG PDF or Excel Spreadsheet and Get It Back Completed in Seconds*

### The Problem in Cyprus & Europe
Large multinational retail chains, logistics conglomerates, hotel booking platforms (TUI, Booking.com), and German automotive suppliers send their small Cypriot suppliers massive, unstructured ESG questionnaires:
- Some arrive as **complex multi-tab Excel files** (`.xlsx`) with protected formulas and drop-down validation lists.
- Others arrive as **scanned PDFs or interactive PDF forms**.
- The SME has no sustainability team. They either ignore the questionnaire (and risk losing the contract) or pay a consulting firm €5,000 to fill out a 40-page questionnaire.

---

### The 5 Super-Tools Powering the Reverse Questionnaire Inbox

#### 1. Inbound Email Router: Postal-Mime + Inngest Serverless Webhooks
- **The Superpower:** Turnkey email parsing with zero infrastructure overhead.
- **How It Works:** Every Vuneli workspace gets a dedicated private email: `workspace-slug@inbox.vuneli.com`.
  - When the SME receives a questionnaire from a client, they simply forward the email with the attachment.
  - `postal-mime` parses the email, extracts the attached `.xlsx` or `.pdf` file, and triggers an asynchronous background job via `Inngest`.

#### 2. Deep Table & Form Layout Understanding: LlamaParse & Microsoft Table-Transformer (TATR)
- **The Superpower:** The state-of-the-art layout parser for tabular and multi-column documents.
- **How It Works:**
  - Standard OCR flattens tables into garbled strings.
  - **LlamaParse** parses complex tables, nested question hierarchies, radio checkboxes, and multi-line descriptions directly into structured JSON trees.
  - For Excel sheets, **Univer / SheetJS** extracts cell coordinates (`Sheet1!B14`), cell validation constraints (e.g. *"Must be a number"* or dropdown options `["Yes", "No", "In Progress"]`), and cell formulas.

#### 3. Semantic Intent & Schema Matching: BAML (Boundary ML) + FastEmbed
- **The Superpower:** Compile-time type-safe structured extraction and semantic mapping.
- **How It Works:** For each extracted question in the client's questionnaire:
  1. Runs local vector similarity (`FastEmbed`) against Vuneli's standardized ESG ontology (GHG Protocol, VSME, CSRD, ISO 14064).
  2. BAML evaluates the candidate question against the company's verified database records:
     - *Question:* "Does your facility have an energy management system compliant with ISO 50001 or equivalent?" -> *Match:* `governance.iso50001_status`.
     - *Question:* "Total direct greenhouse gas emissions from fossil fuel combustion in reporting year 2024 (tonnes CO2 equivalent)" -> *Match:* `emissions.scope1_total_co2e`.
  3. If the question requires a Boolean or Dropdown choice, BAML maps the internal boolean/status to the exact phrasing requested by the questionnaire.

#### 4. Confidence-Scored Human Review: Diffusion / Cell-Level Confidence Scoring
- **The Superpower:** A color-coded verification interface inside Vuneli.
- **How It Works:**
  - **Green Cells (High Confidence >95%):** Directly auto-filled from verified bills (e.g. kWh from EAC bills, diesel litres from fuel receipts).
  - **Amber Cells (Medium Confidence 70-95%):** Pre-filled with an inference, prompting the owner: *"We pre-filled 'No' for hazardous waste permits based on your NACE code. Please confirm."*
  - **Red Cells (Missing Data <70%):** Highlights the 2 or 3 questions where the company has never provided data, with an inline upload dropzone (*"Drop your water bill here to answer this question"*).

#### 5. Formula-Preserving Excel & PDF Form Regeneration: OpenPyXL-Streaming & PyMuPDF Form XFA
- **The Superpower:** Injects answers directly into the client's original file without breaking styling or formulas.
- **How It Works:**
  - For Excel: Uses low-level cell injection to write values into target coordinates while **preserving the original spreadsheet's macros, conditional formatting, and summary formulas**.
  - For PDF: Uses **PyMuPDF / pdf-lib** to populate the interactive AcroForm fields in place.
- **Result:** The completed document looks 100% identical to the client's original questionnaire, completely filled in, with an attached 2-page **Verification Appendix** showing cryptographic hashes for every answered figure.

---

# THE INVESTOR PITCH: WHY THIS COMBINATION WINS THE SEED ROUND

When pitching Vuneli to European Climate VCs (World Fund, Norrsken, Pale Blue Dot) or at Slush:
1. **The Moat:** Generic software builds dashboards and asks users to enter data. Vuneli acts as an **asynchronous clearinghouse**:
   - Inbound: Forward any messy questionnaire $ightarrow$ Vuneli auto-completes it.
   - Outbound: 1-click Bank ESG Pack $ightarrow$ Borrower gets lower interest rate.
2. **Distribution Flywheel:** Every completed questionnaire sent back to an enterprise buyer or bank carries an automated attribution badge:
   *“Verified by Vuneli Sovereign Audit Engine — View Cryptographic Proof at vuneli.com/verify?h=...”*
   This turns every questionnaire into a customer acquisition engine targeting the enterprise buyer.
