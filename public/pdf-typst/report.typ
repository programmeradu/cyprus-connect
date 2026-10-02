// Vuneli drafted report (VSME, CSRD and similar). Bold forest cover. Data: data.json
#let d = json("data.json")
#let ink = rgb("#16201A")
#let body-c = rgb("#2E3830")
#let quiet = rgb("#646E66")
#let rule-c = rgb("#C9D0C6")
#let hair = rgb("#E3E7E0")
#let forest = rgb("#1E3324")
#let accent = rgb("#3F5F33")
#let pale = rgb("#A8C496")
#let warn = rgb("#94531A")
#let display = ("Commissioner",)
#let accent-font = ("Source Serif 4 24pt",)
#let sans = ("Commissioner",)
#let mono = ("IBM Plex Mono", "Commissioner")
#let short-fp = d.hash.slice(0, 16)

#set document(title: d.company + " — " + d.title, author: "Vuneli")
#set text(font: sans, size: 9.5pt, fill: body-c, lang: d.lang, hyphenate: false)
#set par(leading: 0.66em, spacing: 1.15em, justify: true)

#set page(paper: "a4", margin: (top: 30mm, bottom: 24mm, left: 24mm, right: 24mm),
  background: context if counter(page).get().first() > 1 { place(top + left, image("strip-band.jpg", width: 100%, height: 11mm, fit: "cover")) },
  header: context if counter(page).get().first() > 1 {
    set text(size: 7.5pt, fill: quiet)
    grid(columns: (1fr, auto), align: (left + bottom, right + bottom), column-gutter: 12pt,
      [#box(baseline: 1.5pt, image("logo.svg", height: 9pt)) #h(6pt) #box(height: 8pt, line(angle: 90deg, length: 8pt, stroke: 0.5pt + rule-c)) #h(6pt) #d.headLabel #if d.draft [#h(6pt) #text(fill: warn, weight: 600)[Draft]]],
      [#d.company #h(4pt) · #h(4pt) #d.period])
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

#let chapter(n, title, first) = {
  if not first { v(18pt) }
  block(below: 12pt, breakable: false)[
    #text(font: accent-font, style: "italic", size: 40pt, weight: 400, fill: pale)[#n]
    #v(-30pt)
    #text(font: display, size: 20pt, weight: 600, fill: ink)[#title]
    #v(-2pt)
    #line(length: 28mm, stroke: 2pt + accent)
  ]
}

#let datatable(cols, aligns, header, rows) = {
  set text(size: 8.5pt, number-width: "tabular")
  set par(justify: false)
  table(columns: cols, align: aligns, inset: (x: 5pt, y: 6pt),
    stroke: (x, y) => (top: if y == 0 { 0.8pt + ink } else { none },
      bottom: if y == 0 { 0.5pt + ink } else if y == rows.len() { 0.8pt + ink } else { 0.3pt + hair }),
    table.header(..header.map(h => text(size: 7.5pt, weight: 600, fill: ink)[#h])),
    ..rows.flatten())
}

#let note-box(title, items, tone: warn) = block(width: 100%, inset: (left: 10pt, rest: 8pt), stroke: (left: 2pt + tone), fill: rgb("#FAF5EE"), breakable: true)[
  #set par(justify: false)
  #text(weight: 600, fill: tone, size: 9pt)[#title]
  #v(2pt)
  #set text(size: 8.5pt)
  #if type(items) == array { enum(..items.map(i => [#i])) } else [#items]
]

// ---------- Cover ----------
#page(margin: 0mm, header: none, footer: none, fill: forest)[
  #place(bottom + center, image("contours-ondark.png", width: 100%))
  #pad(x: 24mm, top: 22mm)[
    #set text(fill: white)
    #set par(justify: false)
    #grid(columns: (1fr, auto), align: (left + horizon, right + horizon),
      image("logo-white.svg", height: 17pt),
      text(size: 8pt, fill: pale)[#text(font: mono)[#d.docId]])
    #v(-2pt)
    #line(length: 100%, stroke: 0.6pt + pale)
    #v(46mm)
    #text(size: 11pt, weight: 500, fill: pale)[#d.framework #h(6pt) · #h(6pt) #d.period]
    #v(6pt)
    #block(width: 94%)[#set par(leading: 0.24em); #text(font: display, size: if d.title.len() > 48 { 32pt } else { 40pt }, weight: 600, fill: white, tracking: -0.4pt)[#d.title]]
    #v(10pt)
    #text(size: 13pt, weight: 500, fill: rgb("#DCE6D3"))[#d.company]
    #if d.draft [
      #v(8pt)
      #box(stroke: 0.6pt + rgb("#E9C79F"), inset: (x: 7pt, y: 4pt))[#text(size: 8pt, weight: 600, fill: rgb("#E9C79F"))[DRAFT FOR REVIEW]]
    ]
    #v(14mm)
    #grid(columns: (1fr,) * d.coverFacts.len(), column-gutter: 10pt, row-gutter: 4pt,
      ..d.coverFacts.map(f => text(size: 7.5pt, fill: pale)[#f.label]),
      ..d.coverFacts.map(f => text(size: 11pt, weight: 500, fill: white)[#f.value]))
    #v(6pt)
    #text(size: 7.5pt, fill: pale)[Issued #d.issued]
  ]
]

// ---------- Contents + summary ----------
#text(font: display, size: 24pt, weight: 600, fill: ink)[Contents]
#v(8pt)
#for c in d.chapters [
  #grid(columns: (16mm, 1fr, auto), align: (left + horizon, left + horizon, right + horizon),
    text(font: accent-font, style: "italic", size: 15pt, fill: pale)[#c.n],
    text(font: display, size: 12pt, weight: 600, fill: ink)[#c.title],
    text(size: 8pt, fill: quiet)[#if c.gaps.len() > 0 [#c.gaps.len() open gap#if c.gaps.len() > 1 [s]]])
  #v(-6pt)
  #line(length: 100%, stroke: 0.3pt + hair)
]

#if d.draft {
  v(10pt)
  note-box("Draft for review", d.draftNote)
}

#if d.summary.len() > 0 [
  #v(14pt)
  #text(font: display, size: 15pt, weight: 600, fill: ink)[Summary]
  #v(2pt)
  #set text(size: 10.5pt, fill: ink)
  #for p in d.summary [#p #parbreak()]
]

#pagebreak()

#for (i, c) in d.chapters.enumerate() [
  #block(breakable: false)[
    #chapter(c.n, c.title, i == 0)
    #if c.paras.len() > 0 and c.paras.at(0).len() < 900 [#c.paras.at(0)]
  ]
  #for (j, p) in c.paras.enumerate() { if j > 0 or c.paras.at(0).len() >= 900 [#p #parbreak()] }
  #if c.figures.len() > 0 {
    v(4pt)
    datatable((2.4fr, 1.3fr, 2.6fr), (left, right, left), ("Figure", "Value", "Source"),
      c.figures.map(f => ([#f.label], text(weight: 600, fill: ink)[#f.value], text(fill: quiet)[#f.source])))
  }
  #if c.gaps.len() > 0 {
    v(6pt)
    note-box(str(c.gaps.len()) + if c.gaps.len() == 1 { " gap to close" } else { " gaps to close" }, c.gaps)
  }
]

// ---------- About ----------
#v(20pt)
#block(breakable: false)[
#text(font: display, size: 15pt, weight: 600, fill: ink)[About this document]
#v(-4pt)
#line(length: 100%, stroke: 0.4pt + rule-c)
#grid(columns: (1fr, 32mm), column-gutter: 14pt, [
  #set text(size: 8.5pt)
  #set par(justify: false)
  *Sources.* #d.sources.join("; ").

  *Fingerprint.* A SHA-256 fingerprint of every figure printed in this document. Changing any figure changes the fingerprint. Scan the code or enter it at vuneli.com/verify to confirm this is the document Vuneli issued. It is not a legal electronic signature.
  #block(fill: rgb("#F3F5F0"), inset: 8pt, width: 100%)[#text(font: mono, size: 7.5pt, fill: ink)[#d.hash]]
], [#image("qr.svg", width: 32mm) #align(center, text(size: 7pt, fill: quiet)[vuneli.com/verify])])
]
