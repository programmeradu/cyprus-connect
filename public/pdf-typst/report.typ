// Vuneli sustainability report (VSME). Bold cover style. Data: data.json
#let d = json("data.json")
#let ink = rgb("#16201A")
#let body-c = rgb("#2E3830")
#let quiet = rgb("#646E66")
#let rule-c = rgb("#C9D0C6")
#let hair = rgb("#E3E7E0")
#let forest = rgb("#1E3324")
#let accent = rgb("#3F5F33")
#let pale = rgb("#A8C496")
#let serif = ("Source Serif 4 24pt",)
#let sans = ("IBM Plex Sans",)
#let mono = ("IBM Plex Mono", "IBM Plex Sans")
#let short-fp = d.hash.slice(0, 16)

#set document(title: d.company + " — " + d.title, author: "Vuneli")
#set text(font: sans, size: 9.5pt, fill: body-c, lang: d.lang, hyphenate: false)
#set par(leading: 0.66em, spacing: 1.15em, justify: true)

#set page(paper: "a4", margin: (top: 30mm, bottom: 24mm, left: 24mm, right: 24mm),
  header: context if counter(page).get().first() > 1 {
    set text(size: 7.5pt, fill: quiet)
    grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
      [#box(baseline: 1.5pt, image("logo.svg", height: 9pt)) #h(6pt) #box(height: 8pt, line(angle: 90deg, length: 8pt, stroke: 0.5pt + rule-c)) #h(6pt) #d.title],
      [#d.company #h(6pt) · #h(6pt) #d.period])
    v(-4pt); line(length: 100%, stroke: 0.6pt + accent)
  },
  footer: context if counter(page).get().first() > 1 {
    set text(size: 7pt, fill: quiet)
    line(length: 100%, stroke: 0.4pt + rule-c); v(-3pt)
    grid(columns: (1fr, auto, 1fr), align: (left, center, right),
      [Document #text(font: mono)[#d.docId]],
      [#counter(page).display() / #counter(page).final().first()],
      [Fingerprint #text(font: mono)[#short-fp]])
  })

#let chapter(n, title, intro) = {
  pagebreak(weak: true)
  block(below: 16pt)[
    #text(font: serif, size: 54pt, weight: 400, fill: pale)[#n]
    #v(-44pt)
    #text(font: serif, size: 24pt, weight: 600, fill: ink)[#title]
    #v(2pt)
    #line(length: 32mm, stroke: 2pt + accent)
    #v(4pt)
    #block(width: 85%)[#set par(justify: false); #text(size: 11pt, fill: body-c)[#intro]]
  ]
}

#let datatable(cols, aligns, header, rows) = {
  set text(size: 8.5pt, number-width: "tabular")
  set par(justify: false)
  table(columns: cols, align: aligns, inset: (x: 5pt, y: 6pt),
    stroke: (x, y) => (top: if y == 0 { 0.8pt + ink } else { none },
      bottom: if y == 0 { 0.5pt + ink } else if y == rows.len() { 0.8pt + ink } else { 0.3pt + hair }),
    table.header(..header.map(h => text(size: 7.5pt, weight: 600, fill: ink)[#h])),
    ..rows.enumerate().map(((i, r)) => if i == rows.len() - 1 and d.at("boldLast", default: true) { r.map(x => strong(x)) } else { r }).flatten())
}

// ---------- Cover: full-bleed forest ----------
#page(margin: 0mm, header: none, footer: none, fill: forest)[
  #place(bottom + center, image("contours-ondark.png", width: 100%))
  #pad(x: 24mm, top: 22mm)[
    #set text(fill: white)
    #grid(columns: (1fr, auto), align: (left + horizon, right + horizon),
      image("logo-white.svg", height: 17pt),
      text(size: 8pt, fill: pale)[#text(font: mono)[#d.docId]])
    #v(-2pt)
    #line(length: 100%, stroke: 0.6pt + pale)
    #v(52mm)
    #text(size: 11pt, weight: 500, fill: pale)[#d.title #h(6pt) · #h(6pt) #d.period]
    #v(6pt)
    #block(width: 92%)[#set par(justify: false, leading: 0.22em); #text(font: serif, size: 44pt, weight: 600, fill: white, tracking: -0.5pt)[#d.company]]
    #v(10pt)
    #block(width: 75%)[#set par(justify: false); #text(size: 11.5pt, fill: rgb("#DCE6D3"))[#d.subtitle]]
    #v(16mm)
    #grid(columns: (1fr,) * 4, column-gutter: 10pt, row-gutter: 4pt,
      ..d.coverFacts.map(f => text(size: 7.5pt, fill: pale)[#f.label]),
      ..d.coverFacts.map(f => text(size: 11pt, weight: 500, fill: white)[#f.value]))
  ]
]

// ---------- Contents ----------
#page[
  #text(font: serif, size: 24pt, weight: 600, fill: ink)[Contents]
  #v(10pt)
  #for (i, c) in d.chapters.enumerate() [
    #grid(columns: (16mm, 1fr), row-gutter: 0pt,
      text(font: serif, size: 18pt, fill: pale)[#if i < 9 { "0" + str(i + 1) } else { str(i + 1) }],
      [#text(font: serif, size: 13pt, weight: 600, fill: ink)[#c.title] \ #text(size: 8.5pt, fill: quiet)[#c.intro]])
    #line(length: 100%, stroke: 0.3pt + hair)
  ]
]

#for (i, c) in d.chapters.enumerate() [
  #chapter(if i < 9 { "0" + str(i + 1) } else { str(i + 1) }, c.title, c.intro)
  #for p in c.paras [#p #parbreak()]
  #if "table" in c {
    v(6pt)
    datatable(c.table.cols.map(x => x * 1fr), c.table.align.map(a => if a == "r" { right } else { left }), c.table.header, c.table.rows.map(r => r.map(x => [#x])))
    text(size: 7.5pt, fill: quiet)[#c.table.note]
  }
]

// ---------- Back page ----------
#pagebreak()
#text(font: serif, size: 18pt, weight: 600, fill: ink)[About this document]
#v(6pt)
#grid(columns: (1fr, 34mm), column-gutter: 14pt, [
  #set text(size: 8.5pt)
  *Sources.* #d.sources.join("; ").

  *Fingerprint.* A SHA-256 fingerprint of every figure printed in this document. Changing any figure changes the fingerprint. Scan the code or enter it at vuneli.com/verify to confirm this is the document Vuneli issued. It is not a legal electronic signature.
  #block(fill: rgb("#F3F5F0"), inset: 8pt, width: 100%)[#text(font: mono, size: 7.5pt, fill: ink)[#d.hash]]
], [#image("qr.svg", width: 34mm) #align(center, text(size: 7pt, fill: quiet)[vuneli.com/verify])])
