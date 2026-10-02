// Vuneli Board Summary, Typst template. Data comes from data.json.
#let d = json("data.json")
#let ink = rgb("#16201A")
#let body-c = rgb("#2E3830")
#let quiet = rgb("#646E66")
#let rule-c = rgb("#C9D0C6")
#let hair = rgb("#E3E7E0")
#let accent = rgb("#3F5F33")
#let warn = rgb("#94531A")
#let display = ("Commissioner",)
#let accent-font = ("Source Serif 4 24pt",)
#let sans = ("Commissioner",)
#let mono = ("IBM Plex Mono", "Commissioner")

#set document(title: d.company + " — Board summary", author: "Vuneli")
#set text(font: sans, size: 9.5pt, fill: body-c, lang: d.lang, number-type: "lining", hyphenate: false)
#set par(leading: 0.62em, spacing: 1.1em, justify: false)

#let short-fp = d.hash.slice(0, 16)

#set page(
  paper: "a4",
  margin: (top: 28mm, bottom: 24mm, left: 22mm, right: 22mm),
  background: context if counter(page).get().first() > 1 { place(top + left, image("strip-band.jpg", width: 100%, height: 11mm, fit: "cover")) },
  header: context {
    if counter(page).get().first() > 1 [
      #set text(size: 7.5pt, fill: quiet)
      #grid(columns: (1fr, auto), align: (left + bottom, right + bottom),
        [#box(baseline: 1.5pt, image("logo.svg", height: 9pt)) #h(6pt) #box(height: 8pt, line(angle: 90deg, length: 8pt, stroke: 0.5pt + rule-c)) #h(6pt) Board summary],
        [#d.company],
      )
      #v(-4pt)
      #line(length: 100%, stroke: 0.6pt + accent)
    ]
  },
  footer: context {
    if counter(page).get().first() > 1 [
      #set text(size: 7pt, fill: quiet)
      #line(length: 100%, stroke: 0.4pt + rule-c)
      #v(-3pt)
      #grid(columns: (1fr, auto, 1fr), align: (left, center, right),
        [Document #text(font: mono)[#d.docId]],
        [Page #counter(page).display() of #counter(page).final().first()],
        [Fingerprint #text(font: mono)[#short-fp]],
      )
    ]
  },
)

#let section(n, title, summary: none) = {
  v(14pt)
  block(breakable: false, below: 10pt)[
    #grid(columns: (22pt, 1fr), column-gutter: 6pt,
      text(font: accent-font, style: "italic", size: 15pt, weight: 400, fill: accent)[#n],
      text(font: display, size: 15pt, weight: 600, fill: ink)[#title],
    )
    #v(-2pt)
    #line(length: 100%, stroke: 0.4pt + rule-c)
    #if summary != none { v(2pt); text(size: 9pt, fill: quiet)[#summary] }
  ]
}

#let ruled-table(cols, aligns, header, rows, empty) = {
  if rows.len() == 0 { text(fill: quiet, style: "italic")[#empty]; return }
  set text(size: 8.5pt, number-width: "tabular")
  table(
    columns: cols, align: aligns, inset: (x: 5pt, y: 6pt),
    stroke: (x, y) => (
      top: if y == 0 { 0.8pt + ink } else { none },
      bottom: if y == 0 { 0.5pt + ink } else if y == rows.len() { 0.8pt + ink } else { 0.3pt + hair },
    ),
    table.header(..header.map(h => text(size: 7.5pt, weight: 600, fill: ink)[#h])),
    ..rows.flatten(),
  )
}

#let status-text(s) = {
  if s == "at_risk" { text(fill: warn, weight: 600)[At risk] }
  else if s == "on_track" { text(fill: accent)[On track] }
  else if s == "done" { text(fill: accent)[Done] }
  else { text(fill: quiet)[Planned] }
}

// ---------- Cover ----------
#page(margin: (top: 76mm, bottom: 0mm, left: 22mm, right: 22mm), header: none, footer: none, background: place(top + left, image("cover-band.jpg", width: 100%)))[
  #grid(columns: (1fr, auto), align: (left + horizon, right + horizon),
    box(image("logo.svg", height: 16pt)),
    text(size: 8pt, fill: quiet)[#d.issued],
  )
  #v(30mm)
  #text(size: 10pt, weight: 500, fill: accent)[Board summary]
  #v(4pt)
  #block(width: 88%)[#text(font: display, size: 34pt, weight: 600, fill: ink, tracking: -0.3pt)[#par(leading: 0.28em)[#d.company]]]
  #v(8pt)
  #block(width: 78%)[#text(size: 11pt, fill: body-c)[#par(leading: 0.6em)[Where the company stands on emissions, deadlines and the decisions waiting for the board.]]]
  #v(18mm)
  #set text(size: 8.5pt)
  #grid(columns: (1fr, 1fr, 1fr, 1fr), column-gutter: 10pt, row-gutter: 4pt,
    ..("Sector", "Country", "Footprint, 12 months", "Decisions waiting").map(l => text(size: 7.5pt, fill: quiet)[#l]),
    ..(d.sector, d.country, d.cover.footprint, str(d.decisionsTotal)).map(v => text(weight: 500, fill: ink, size: 10pt)[#v]),
  )
  #v(4pt)
  #line(length: 100%, stroke: 0.4pt + rule-c)
  #place(bottom + center, dx: 0mm, dy: 0mm, image("contours-soft.png", width: 100% + 44mm))
  #v(3pt)
  #text(size: 7pt, fill: quiet)[Prepared from records held in the company's Vuneli workspace. Fingerprint #text(font: mono)[#short-fp] — check at vuneli.com/verify]
]

// ---------- 01 At a glance ----------
#section("01", "At a glance", summary: "Four figures, each taken from the company's own records.")
#{
  let kpi(label, value, unit, note, tone: ink) = block(width: 100%, inset: (top: 8pt, bottom: 2pt))[
    #text(size: 7.5pt, fill: quiet)[#label] \
    #v(2pt)
    #text(font: display, size: 22pt, weight: 600, fill: tone, number-width: "tabular")[#value]#if unit != "" [#h(3pt)#text(size: 8.5pt, fill: quiet)[#unit]] \
    #v(1pt)
    #text(size: 7.5pt, fill: quiet)[#note]
  ]
  grid(columns: (1fr,) * 4, column-gutter: 0pt,
    stroke: (x, y) => (left: if x > 0 { 0.4pt + rule-c } else { none }),
    inset: (x: 8pt), 
    ..d.kpis.map(k => kpi(k.label, k.value, k.unit, k.note, tone: if k.tone == "warn" { warn } else if k.tone == "good" { accent } else { ink })))
  v(4pt)
  line(length: 100%, stroke: 0.4pt + rule-c)
}

// ---------- 02 Footprint ----------
#section("02", "Footprint", summary: "Monthly emissions over the last twelve months. The latest month is shown in full colour.")
#if d.months.len() == 0 {
  block(fill: rgb("#F3F5F0"), inset: 10pt, width: 100%)[#text(weight: 600, fill: ink)[No footprint readings yet.] Upload an electricity bill or connect the bank account on the Connect page, and the footprint appears here.]
} else {
  let pts = d.months
  let mx0 = calc.max(0, ..pts.map(p => p.value))
  let mx = if mx0 > 0 { mx0 } else { 1 }
  let slots = calc.max(12, pts.len())
  let empty = slots - pts.len()
  let h = 52mm
  set text(size: 7pt, fill: quiet, number-width: "tabular")
  grid(columns: (auto, 1fr), column-gutter: 6pt,
    // y axis labels
    box(height: h, {
      for i in range(0, 5) {
        place(top + right, dy: h * (1 - i / 4) - 4pt, [#calc.round(mx * i / 4, digits: if mx < 4 { 2 } else if mx < 40 { 1 } else { 0 })])
      }
    }),
    box(width: 100%, height: h, {
      for i in range(0, 5) { place(top, dy: h * (1 - i / 4), line(length: 100%, stroke: if i == 0 { 0.6pt + ink } else { 0.3pt + hair })) }
      grid(columns: (1fr,) * slots, column-gutter: 5pt, align: bottom,
        ..range(empty).map(_ => []), ..pts.enumerate().map(((i, p)) => box(width: 100%, height: h, align(bottom, rect(width: 100%, height: h * p.value / mx, fill: if i == pts.len() - 1 { accent } else { rgb("#AFC2A5") }, stroke: none)))))
    }),
  )
  v(-2pt)
  pad(left: 18pt, grid(columns: (1fr,) * slots, column-gutter: 5pt, align: center, ..range(empty).map(_ => []), ..pts.map(p => [#p.label])))
  v(4pt)
  text(size: 7.5pt, fill: quiet)[Unit: #d.unit. Sources: #d.sources.join(", ").]
}

// ---------- 03 Deadlines ----------
#section("03", "Deadlines", summary: "Open obligations, soonest first.")
#ruled-table((1.1fr, 3fr, 1.1fr, 0.9fr, 0.8fr), (left, left, left, left, right),
  ("Framework", "Obligation", "Due", "Status", "Prepared"),
  d.deadlines.map(x => (text(weight: 500, fill: ink)[#x.framework], [#x.title], [#x.due], status-text(x.status), [#x.progress%])),
  "No open deadlines.")

// ---------- 04 Decisions ----------
#section("04", "Decisions waiting for a person", summary: "Every agent action that changes something outside the workspace waits here for approval.")
#ruled-table((4fr, 1fr, 0.9fr, 1.1fr), (left, left, left, left),
  ("Decision", "Type", "Priority", "Due"),
  d.decisions.map(x => ([#x.title], [#x.kind], if x.severity == "high" { text(fill: warn, weight: 600)[High] } else [#x.severity], [#x.due])),
  "Nothing is waiting.")

// ---------- 05 Activity ----------
#section("05", "Recent activity", summary: "What people and agents changed most recently.")
#ruled-table((1fr, 1.4fr, 4fr), (left, left, left),
  ("When", "Who", "What"),
  d.activity.map(x => ([#x.when], if x.agent { text(fill: accent)[#x.who] } else [#x.who], [#x.what])),
  "No activity recorded yet.")

// ---------- About ----------
#section("06", "About this document")
#grid(columns: (1fr, 34mm), column-gutter: 14pt,
  [
    #set text(size: 8.5pt)
    *Sources.* #d.sources.join("; ").

    *Fingerprint.* A SHA-256 fingerprint of every figure printed in this document. Changing any figure changes the fingerprint. Enter it or scan the code at vuneli.com/verify to confirm the document is the one Vuneli issued. It is not a legal electronic signature.

    #block(fill: rgb("#F3F5F0"), inset: 8pt, width: 100%)[#text(font: mono, size: 7.5pt, fill: ink)[#d.hash]]
  ],
  [#image("qr.svg", width: 34mm) #align(center, text(size: 7pt, fill: quiet)[vuneli.com/verify])],
)
