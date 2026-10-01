// Vuneli CBAM declaration working paper. Official-form style. Data: data.json
#let d = json("data.json")
#let ink = rgb("#111814")
#let body-c = rgb("#2A322C")
#let quiet = rgb("#5E6860")
#let rule-c = rgb("#B9C1B8")
#let hair = rgb("#DDE2DA")
#let field = rgb("#F2F4EF")
#let accent = rgb("#3F5F33")
#let warn = rgb("#94531A")
#let bad = rgb("#9B2C2C")
#let eu = rgb("#1F3A68")
#let display = ("Commissioner",)
#let accent-font = ("Source Serif 4 24pt",)
#let sans = ("Commissioner",)
#let mono = ("IBM Plex Mono", "Commissioner")
#let short-fp = d.hash.slice(0, 16)
#let tone-c(t) = if t == "good" { accent } else if t == "warn" { warn } else if t == "bad" { bad } else { body-c }

#set document(title: d.company + " — CBAM declaration " + str(d.year), author: "Vuneli")
#set text(font: sans, size: 9pt, fill: body-c, lang: "en", hyphenate: false)
#set par(leading: 0.6em, spacing: 1em)

#set page(paper: "a4", margin: (top: 27mm, bottom: 22mm, left: 18mm, right: 18mm),
  header: context {
    set text(size: 7.5pt, fill: quiet)
    grid(columns: (auto, 1fr, auto), align: (left + horizon, center + horizon, right + horizon), column-gutter: 10pt,
      box(image("logo.svg", height: 10pt)),
      [CBAM annual declaration #str(d.year) · working paper · Regulation (EU) 2023/956],
      [#text(font: mono)[#d.docId]])
    v(-3pt)
    line(length: 100%, stroke: 1.2pt + ink)
  },
  footer: context {
    set text(size: 7pt, fill: quiet)
    line(length: 100%, stroke: 0.4pt + rule-c); v(-3pt)
    grid(columns: (1fr, auto, 1fr), align: (left, center, right),
      [#d.company],
      [Page #counter(page).display() of #counter(page).final().first()],
      [Fingerprint #text(font: mono)[#short-fp]])
  })

// Numbered form box, as on customs documents.
#let fbox(n, label, value, span: 1) = table.cell(colspan: span, inset: 0pt)[
  #block(width: 100%, inset: (x: 6pt, top: 5pt, bottom: 7pt))[
    #text(size: 6.5pt, fill: quiet)[#box(fill: ink, inset: (x: 2.5pt, y: 1pt), text(fill: white, weight: 600, size: 6pt)[#n]) #h(3pt) #label]
    #v(1pt)
    #text(size: 10pt, weight: 500, fill: ink)[#value]
  ]
]

#let part(n, title, lede: none) = {
  v(12pt)
  block(breakable: false, below: 8pt)[
    #grid(columns: (auto, 1fr), column-gutter: 0pt,
      box(fill: ink, inset: (x: 6pt, y: 4pt))[#text(fill: white, weight: 700, size: 9pt)[Part #n]],
      box(stroke: (bottom: 1.2pt + ink, top: 1.2pt + ink, right: 1.2pt + ink), inset: (x: 8pt, y: 4pt), width: 100%)[#text(weight: 600, size: 9pt, fill: ink)[#title]])
    #if lede != none { v(3pt); text(size: 8pt, fill: quiet)[#lede] }
  ]
}

#let grid-table(cols, aligns, header, rows, foot: none, size: 8pt) = {
  set text(size: size, number-width: "tabular")
  let n = rows.len()
  table(columns: cols, align: aligns, inset: (x: 4pt, y: 5pt),
    stroke: (x, y) => (
      top: if y == 0 { 1pt + ink } else { none },
      bottom: if y == 0 { 0.6pt + ink } else { 0.3pt + hair },
      left: if x > 0 { 0.3pt + hair } else { none },
    ),
    fill: (x, y) => if y == 0 { field } else { none },
    table.header(..header.map(h => text(size: 6.8pt, weight: 600, fill: ink)[#h])),
    ..rows.flatten(),
    ..if foot != none { foot.map(f => table.cell(stroke: (top: 1pt + ink, bottom: 1pt + ink), text(weight: 700, fill: ink)[#f])) } else { () },
  )
}

// ---------- Form head (page 1) ----------
#grid(columns: (1fr, 52mm), column-gutter: 10pt,
  [
    #text(size: 8pt, weight: 600, fill: eu)[EUROPEAN UNION · CARBON BORDER ADJUSTMENT MECHANISM]
    #v(2pt)
    #text(font: display, size: 26pt, weight: 600, fill: ink)[CBAM declaration #str(d.year)]
    #v(-2pt)
    #text(size: 10pt, fill: body-c)[Annual declaration working paper for #text(weight: 600)[#d.company]]
  ],
  block(stroke: 1pt + ink, inset: 7pt, width: 100%)[
    #set text(size: 7.5pt)
    #text(fill: quiet)[Status] \
    #text(size: 10pt, weight: 700, fill: tone-c(d.statusTone))[#d.statusText]
    #v(3pt)
    #text(fill: quiet)[Due] #h(1fr) #text(weight: 600, fill: ink)[#d.due] \
    #text(fill: quiet)[Issued] #h(1fr) #text(fill: ink)[#d.issued]
  ],
)
#v(8pt)
#table(columns: (1fr, 1fr, 1fr), stroke: 0.6pt + ink, inset: 0pt,
  fbox("1", "Declarant (legal name)", d.company, span: 2), fbox("2", "Reporting year", str(d.year)),
  fbox("3", "EORI number", text(font: mono)[#d.eori]), fbox("4", "CBAM account number", text(font: mono)[#d.account]), fbox("5", "Import lines", d.lineCount),
  fbox("6", "Embedded emissions", d.kpis.at(0).value + " tCO₂e"), fbox("7", "CBAM certificates", d.kpis.at(2).value), fbox("8", "Estimated cost", d.kpis.at(3).value),
)
#v(4pt)
#text(size: 7.5pt, fill: quiet)[This is a working paper for the declarant, customs broker or verifier. It is not the filing: the declaration is submitted by the authorised declarant in the EU CBAM Registry.]

// ---------- Part 1 Summary ----------
#part("1", "Summary")
#grid(columns: (1fr,) * 4, stroke: (x, y) => (left: if x > 0 { 0.4pt + rule-c } else { none }), inset: (x: 7pt, y: 2pt),
  ..d.kpis.map(k => [
    #text(size: 7pt, fill: quiet)[#k.label] \
    #text(font: display, size: 18pt, weight: 600, fill: tone-c(k.tone), number-width: "tabular")[#k.value]#if k.unit != "" [#h(2pt)#text(size: 8pt, fill: quiet)[#k.unit]] \
    #text(size: 7pt, fill: quiet)[#k.note]
  ]))
#for n in d.notes {
  v(6pt)
  block(width: 100%, inset: (left: 9pt, rest: 7pt), stroke: (left: 2pt + tone-c(n.tone)), fill: field)[#text(weight: 600, fill: tone-c(n.tone))[#n.title] \ #text(size: 8.5pt)[#n.body]]
}

// ---------- Part 2 By sector ----------
#part("2", "Embedded emissions by sector")
#if d.sectors.len() == 0 [#text(fill: quiet, style: "italic")[No CBAM goods counted.]] else {
  set text(size: 8.5pt, number-width: "tabular")
  grid(columns: (34mm, 1fr, 28mm, 20mm), row-gutter: 7pt, column-gutter: 8pt, align: (left + horizon, left + horizon, right + horizon, right + horizon),
    ..d.sectors.map(s => (
      text(weight: 500, fill: ink)[#s.label],
      box(width: 100%, height: 7pt, fill: hair, place(left, rect(width: s.share * 100%, height: 7pt, fill: accent, stroke: none))),
      text(weight: 600, fill: ink)[#s.value tCO₂e],
      text(fill: quiet)[#s.note],
    )).flatten())
}

// ---------- Part 3 By supplier ----------
#part("3", "By supplier")
#grid-table((3fr, 0.7fr, 1fr, 1.3fr), (left, right, right, right),
  ("Supplier", "Lines", "On EU defaults", "Embedded tCO₂e"),
  d.suppliers.map(s => ([#s.name], [#s.lines], if s.defaults > 0 { text(fill: warn)[#s.defaults] } else { text(fill: quiet)[0] }, text(weight: 600, fill: ink)[#s.em])))

// ---------- Part 4 Lines ----------
#pagebreak()
#part("4", "Import lines", lede: "Every line in the declaration, with the value basis and the EU default table used where no supplier value was given.")
#grid-table((18mm, 2.1fr, 1fr, 1.1fr, 1.5fr, 0.9fr, 0.9fr), (left, left, right, left, left, right, right),
  ("CN code", "Supplier · origin", "Net mass", "Basis", "Default used", "tCO₂e", "Cost"),
  d.lines.map(l => (
    box(text(font: mono, size: 7.3pt, fill: ink)[#l.cn.replace(" ", "\u{00A0}")]),
    [#l.supplier · #l.origin #if l.inst != "" [\ #text(size: 6.8pt, fill: quiet, font: mono)[#l.inst]]],
    [#l.mass],
    text(fill: tone-c(l.basisTone), weight: 500)[#l.basis],
    text(size: 7pt, fill: quiet)[#l.def],
    text(weight: 600, fill: ink)[#l.em],
    [#l.cost],
  )),
  foot: d.foot, size: 7.6pt)
#if d.provisional [#v(2pt) #text(size: 7pt, fill: quiet)[\* Uses the latest published certificate price; the quarter's official price is not yet published.]]

// ---------- Part 5 Issues ----------
#part("5", "Open issues", lede: if d.issues.len() > 0 { "Fix these before signing." } else { none })
#if d.issues.len() == 0 [#text(fill: accent, weight: 500)[No open issues.]] else {
  grid-table((8mm, 5fr, 1.2fr), (left, left, left), ("#", "Issue", "Lines"),
    d.issues.enumerate().map(((i, x)) => ([#(i + 1)], [#x.msg], text(font: mono, size: 7pt)[#x.lines])))
}

// ---------- Part 6 Method ----------
#part("6", "Method and legal basis")
#block(breakable: false)[
#set text(size: 8.3pt)
#set par(justify: true)
#d.method
#v(4pt)
#set text(size: 7.8pt, fill: quiet)
#list(..d.sources.map(s => [#s]))
]

// ---------- Signature + fingerprint ----------
#v(12pt)
#block(breakable: false)[
#grid(columns: (1fr, 1fr, 30mm), column-gutter: 10pt,
  block(stroke: 1pt + ink, inset: 8pt, width: 100%, height: 34mm)[
    #text(size: 6.8pt, fill: quiet)[#box(fill: ink, inset: (x: 2.5pt, y: 1pt), text(fill: white, weight: 600, size: 6pt)[9]) #h(3pt) Signature recorded in Vuneli]
    #v(4pt)
    #if d.signature != none [
      #text(size: 10pt, weight: 600, fill: ink)[#d.signature.by] \
      #text(size: 8pt)[#d.signature.at] \
      #v(2pt)
      #text(font: mono, size: 6.5pt, fill: quiet)[Draft #d.signature.draft]
    ] else [#text(size: 8.5pt, fill: quiet, style: "italic")[Not signed yet.]]
  ],
  block(stroke: 1pt + ink, inset: 8pt, width: 100%, height: 34mm)[
    #text(size: 6.8pt, fill: quiet)[#box(fill: ink, inset: (x: 2.5pt, y: 1pt), text(fill: white, weight: 600, size: 6pt)[10]) #h(3pt) Document fingerprint (SHA-256)]
    #v(4pt)
    #text(font: mono, size: 7pt, fill: ink)[#d.hash.clusters().chunks(4).map(c => c.join()).join(" ")]
    #v(2pt)
    #text(size: 6.8pt, fill: quiet)[Proves the figures are unchanged since export. Not a legal electronic signature.]
  ],
  [#image("qr.svg", width: 30mm) #align(center, text(size: 6.5pt, fill: quiet)[vuneli.com/verify])],
)
]
