"use client";

/**
 * /lab/rinesk — pixel replica of the supplied Rinesk dashboard artwork.
 * Authored on a fixed 1024x768 stage (mockup pixels) and uniformly scaled to
 * the viewport, so nothing reflows away from the reference.
 */

import { Nunito } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import "./rinesk.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

/* ------------------------------------------------------------------ */
/* geometry helpers                                                     */
/* ------------------------------------------------------------------ */

/** Catmull-Rom -> cubic bezier, for the hero wave. */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* measured off the artwork (window-relative coordinates) */
const WAVE: [number, number][] = [
  [432, 271], [443, 272], [453, 276], [463, 277], [473, 273], [483, 266],
  [493, 261], [503, 261], [513, 266], [523, 272], [533, 275], [543, 273],
  [553, 270], [563, 267], [573, 263], [583, 263], [593, 265], [603, 267],
  [613, 271], [623, 272], [633, 271], [643, 267], [653, 262], [663, 257],
  [673, 255], [683, 256], [693, 259], [703, 263], [713, 266], [723, 267],
  [733, 265], [743, 261], [753, 259], [763, 263], [773, 267], [783, 273],
  [793, 278], [802, 281], [814, 284], [824, 286],
];

/** comb ticks: [x, top] measured off the artwork; shared baseline at y=300 */
const TICKS: [number, number][] = [
  [432, 283], [445, 273], [458, 283], [470, 270], [483, 266], [496, 271],
  [509, 266], [522, 271], [535, 275], [547, 272], [560, 264], [573, 276],
  [586, 266], [599, 269], [612, 270], [624, 281], [637, 270], [650, 283],
  [663, 276], [676, 264], [689, 270], [701, 265], [714, 276], [727, 266],
  [740, 281], [753, 276], [766, 264], [778, 270], [791, 277], [804, 282],
];

const CURSOR_X = 678;

/** CSAT-over-time bars: [height, isYellow] left to right */
const BARS: [number, boolean][] = [
  [4, false], [5, false], [6, false], [7, false], [9, false], [8, false],
  [12, false], [15, false], [22, false], [18, false], [16, false], [20, false],
  [26, false], [21, false], [30, true], [34, true], [28, false], [38, true],
  [24, false], [31, true], [20, false], [26, false], [18, false], [22, false],
  [16, false], [24, false], [29, false], [23, false], [34, true], [42, true],
  [55, true], [37, false], [30, false], [26, false], [21, false], [17, false],
  [24, false], [31, false], [40, true], [27, false], [23, false], [19, false],
  [25, false], [21, false], [17, false], [13, false],
];

/* ------------------------------------------------------------------ */
/* tiny line icons                                                      */
/* ------------------------------------------------------------------ */

type IcoProps = { size?: number; color?: string; sw?: number };

const S = (p: IcoProps & { children: React.ReactNode }) => (
  <svg
    width={p.size ?? 12}
    height={p.size ?? 12}
    viewBox="0 0 24 24"
    fill="none"
    stroke={p.color ?? "rgba(35,46,46,.62)"}
    strokeWidth={p.sw ?? 1.7}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {p.children}
  </svg>
);

const IcoPhone = (p: IcoProps) => (
  <S {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />
    <circle cx="17" cy="6.5" r="2.6" />
  </S>
);
const IcoStar = (p: IcoProps) => (
  <S {...p}>
    <path d="m12 4 2.5 5.1 5.5.8-4 3.9.9 5.6L12 16.8 7.1 19.4l.9-5.6-4-3.9 5.5-.8Z" />
  </S>
);
const IcoPie = (p: IcoProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 3.8V12l7 4.2" />
  </S>
);
const IcoCrown = (p: IcoProps) => (
  <S {...p}>
    <path d="M4 17.5 3 7.5l5 4 4-6 4 6 5-4-1 10Z" />
  </S>
);
const IcoHistory = (p: IcoProps) => (
  <S {...p}>
    <path d="M3.6 12a8.4 8.4 0 1 0 2.6-6.1L3.4 8.6" />
    <path d="M3.2 4.6v4.2h4.2" />
    <path d="M12 7.8V12l3.1 1.9" />
  </S>
);
const IcoGear = (p: IcoProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="3.1" />
    <path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H10a1.6 1.6 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V10a1.6 1.6 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
  </S>
);
const IcoBell = (p: IcoProps) => (
  <S {...p}>
    <path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5" />
    <path d="M13.7 19.5a2 2 0 0 1-3.4 0" />
  </S>
);
const IcoSearch = (p: IcoProps) => (
  <S {...p}>
    <circle cx="11" cy="11" r="6.4" />
    <path d="m20 20-3.8-3.8" />
  </S>
);
const IcoExpand = (p: IcoProps) => (
  <S {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 13 11" />
    <path d="M10 20H4v-6" />
    <path d="m4 20 7-7" />
  </S>
);
const IcoChevron = (p: IcoProps) => (
  <S {...p}>
    <path d="m6 9 6 6 6-6" />
  </S>
);

/* ------------------------------------------------------------------ */
/* absolutely-positioned box helper                                     */
/* ------------------------------------------------------------------ */

function A({
  l,
  t,
  w,
  h,
  style,
  className,
  children,
}: {
  l: number;
  t: number;
  w?: number;
  h?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{ position: "absolute", left: l, top: t, width: w, height: h, ...style }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function WaveHand() {
  // Small waving-hand mark drawn as vector art: emoji fonts are not present
  // in the render target, so a literal glyph would fall back to tofu.
  return (
    <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden>
      <g transform="rotate(20 20 20)" stroke="#d99b1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M13 26V11.5a2.2 2.2 0 0 1 4.4 0V22M17.4 21V9.2a2.2 2.2 0 0 1 4.4 0V21M21.8 21V10.6a2.2 2.2 0 0 1 4.4 0V22M26.2 16.4a2.2 2.2 0 0 1 4.4 0v6.9c0 5.6-4 9.3-9.4 9.3-4.6 0-7.2-2-9-5.7l-2.6-5.3a2.2 2.2 0 0 1 3.7-2.3l2.7 3.4"
          fill="#f7cd63"
        />
      </g>
      <g stroke="#d99b1f" strokeWidth="1.9" strokeLinecap="round">
        <path d="M32.5 8.5 34.6 6.4M35.4 13.2h3M30.2 5.6l1-2.8" />
      </g>
    </svg>
  );
}

export default function RineskPage() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const s = Math.min(window.innerWidth / 1024, window.innerHeight / 768);
      setScale(s);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const legend = [
    { key: "VI Prediction", value: "11.2k calls", mark: "dash" as const },
    { key: "Answered", value: "8.7k calls", mark: "dot" as const },
    { key: "Missed", value: "2.1k calls", mark: "faint" as const },
  ];

  const tabs = [
    ["Calls", 28],
    ["Overview", 100],
    ["Moments", 182],
    ["Keywords", 260],
    ["Unanswered", 348],
    ["Service Level", 441],
    ["CSAT Surveys", 536],
    ["Duration", 624],
    ["Texts", 695],
    ["Agent Status", 774],
  ] as const;

  const navItems = [
    ["Home", 265],
    ["Statistics", 322],
    ["Agents", 379],
    ["Groups", 431],
    ["Numbers", 489],
    ["Dialer", 544],
    ["Contacts", 599],
  ] as const;

  return (
    <div className={`rk-root ${nunito.className}`} style={{ ["--rk-font" as string]: nunito.style.fontFamily }}>
      <div ref={wrapRef} className="rk-stage" style={{ transform: `scale(${scale})` }}>
        <div className="rk-window">
          {/* ============================ TOP CARD ============================ */}
          <div className="rk-card1">
            {/* logo */}
            <A l={20} t={22}>
              <svg width="26" height="24" viewBox="0 0 26 24" fill="none">
                <path
                  d="M2 3.2C2 2.54 2.54 2 3.2 2H14.4C19.2 2 22.4 5.1 22.4 9.4c0 4.6-3.6 8.1-8.5 8.1H3.2c-.66 0-1.2-.54-1.2-1.2V3.2Z"
                  fill="#EEFB4B"
                />
                <circle cx="18.6" cy="20.2" r="3.1" fill="#EEFB4B" />
              </svg>
            </A>
            <A l={57} t={27} style={{ fontSize: 12, fontWeight: 800, letterSpacing: -0.1, color: "#1e2a2a" }}>
              Rinesk
            </A>

            {/* nav */}
            <A l={292} t={20} w={60} h={30} className="rk-pill" />
            {navItems.map(([label, x]) => (
              <A
                key={label}
                l={x}
                t={31}
                className="rk-nav"
                style={
                  label === "Statistics"
                    ? { color: "#1f2b2b", fontWeight: 800 }
                    : undefined
                }
              >
                {label}
              </A>
            ))}

            {/* header right controls */}
            <A l={759} t={20} w={31} h={30} className="rk-iconbtn">
              <IcoGear size={12.5} sw={1.6} />
            </A>
            <A l={793} t={20} w={31} h={30} className="rk-iconbtn">
              <IcoBell size={12.5} sw={1.6} />
              <A l={19} t={7} w={5} h={5} style={{ borderRadius: 99, background: "#EEFB4B", boxShadow: "0 0 0 1.5px rgba(255,255,255,.35)" }} />
            </A>
            <A
              l={827}
              t={21}
              w={28}
              h={28}
              style={{ borderRadius: 9, overflow: "hidden", boxShadow: "0 0 0 1.5px rgba(255,255,255,.4)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rk-avatar" src="/lab/rinesk/avatar-adam.jpg" alt="" width={28} height={28} style={{ width: 28, height: 28, objectPosition: "50% 22%" }} />
            </A>

            {/* ---- team row ---- */}
            <A l={20} t={103} w={33} h={33} style={{ borderRadius: 11, overflow: "hidden", background: "rgba(255,255,255,.5)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="rk-avatar" src="/lab/rinesk/avatar-adam.jpg" alt="" width={33} height={33} style={{ width: 33, height: 33, objectPosition: "50% 20%" }} />
            </A>
            <A l={60} t={107} style={{ fontSize: 7.6, fontWeight: 600, color: "rgba(35,46,46,.52)" }}>
              Team A Lead
            </A>
            <A l={60} t={119} style={{ fontSize: 10.4, fontWeight: 800, letterSpacing: -0.1, color: "#1e2a2a" }}>
              Adam Williams
            </A>

            <A
              l={172}
              t={103}
              w={74}
              h={32}
              className="rk-yellow"
              style={{
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8.4,
                fontWeight: 800,
                color: "#22301f",
                boxShadow: "0 6px 14px -6px rgba(160,190,40,.65)",
              }}
            >
              Add teammate
            </A>
            <A l={254} t={103} w={32} h={32} className="rk-iconbtn" style={{ borderRadius: 11 }}>
              <IcoSearch size={12} sw={1.7} />
            </A>

            {/* greeting */}
            <A l={462} t={91} style={{ fontSize: 19.5, fontWeight: 600, letterSpacing: -0.3, color: "#1c2827", whiteSpace: "nowrap" }}>
              Hey, Matthew!
            </A>
            <A l={592} t={92} w={22} h={22}>
              <WaveHand />
            </A>
            <A l={462} t={116} style={{ fontSize: 18.5, fontWeight: 500, letterSpacing: -0.3, color: "rgba(35,46,46,.45)", whiteSpace: "nowrap" }}>
              Explore your team`s records history
            </A>
            <A
              l={816}
              t={99}
              w={37}
              h={37}
              style={{
                borderRadius: 99,
                background: "rgba(255,255,255,.42)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IcoHistory size={13} sw={1.7} color="rgba(35,46,46,.7)" />
            </A>

            {/* ---- left icon rail ---- */}
            <A l={20} t={182} w={30} h={30} style={{ borderRadius: 10, background: "rgba(255,255,255,.28)" }} />
            <A l={20} t={182} w={30} h={30} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoPhone size={12.5} sw={1.6} color="rgba(35,46,46,.75)" />
            </A>
            <A l={20} t={219} w={30} h={30} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoStar size={12.5} sw={1.5} color="rgba(35,46,46,.58)" />
            </A>
            <A l={20} t={248} w={30} h={30} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoPie size={12.5} sw={1.5} color="rgba(35,46,46,.58)" />
            </A>
            <A l={20} t={278} w={30} h={30} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoCrown size={12.5} sw={1.5} color="rgba(35,46,46,.58)" />
            </A>
            <A l={20} t={307} w={30} h={30} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoHistory size={12.5} sw={1.5} color="rgba(35,46,46,.58)" />
            </A>

            {/* ---- hero copy ---- */}
            <A l={82} t={190} style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2, color: "#1e2a2a" }}>
              All Calls
            </A>
            <A l={82} t={208} w={200} style={{ fontSize: 7.6, fontWeight: 600, lineHeight: "11.4px", color: "rgba(35,46,46,.52)" }}>
              Explore what&apos;s happening on your team&apos;s
              <br />
              Dialpad calls with Voice Intelligence.
              <br />
              <span style={{ color: "#1e2a2a", fontWeight: 800 }}>Need help?</span>
            </A>

            <A l={80} t={265} style={{ fontSize: 46, fontWeight: 300, letterSpacing: -2, lineHeight: "56px", color: "#1a2626" }}>
              10.8
              <span style={{ fontSize: 22, fontWeight: 400, letterSpacing: -0.5 }}>k</span>
            </A>

            {/* legend */}
            {legend.map((row, i) => {
              const top = 285 + i * 15;
              return (
                <div key={row.key}>
                  <A l={268} t={top + 4} w={12} h={2}>
                    {row.mark === "dash" ? (
                      <div style={{ width: 12, height: 2, borderRadius: 2, background: "#E8F94A" }} />
                    ) : (
                      <div
                        style={{
                          width: 4.5,
                          height: 4.5,
                          borderRadius: 99,
                          marginLeft: 3.5,
                          marginTop: -1.4,
                          background: row.mark === "dot" ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.4)",
                        }}
                      />
                    )}
                  </A>
                  <A l={286} t={top} style={{ fontSize: 8, fontWeight: 600, color: "rgba(35,46,46,.62)", whiteSpace: "nowrap" }}>
                    {row.key}
                  </A>
                  <A l={330} t={top} w={68} style={{ fontSize: 8, fontWeight: 800, color: "#1e2a2a", textAlign: "right" }}>
                    {row.value}
                  </A>
                </div>
              );
            })}

            {/* ---- chart axis labels ---- */}
            <A l={355} t={190} style={{ fontSize: 8, fontWeight: 600, color: "rgba(35,46,46,.5)" }}>
              June 2024
            </A>
            {[
              ["W1", 430],
              ["W2", 519],
              ["W3", 608],
              ["W5", 790],
            ].map(([w, x]) => (
              <A key={w as string} l={x as number} t={190} style={{ fontSize: 7.6, fontWeight: 600, color: "rgba(35,46,46,.38)" }}>
                {w}
              </A>
            ))}

            {["400", "300", "200", "100", "0", "100"].map((v, i) => (
              <A key={v + i} l={836} t={230 + i * 20.6} style={{ fontSize: 7.6, fontWeight: 600, color: "rgba(35,46,46,.38)" }}>
                {v}
              </A>
            ))}

            {/* ---- chart svg ---- */}
            <svg
              width="873"
              height="358"
              viewBox="0 0 873 358"
              fill="none"
              style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }}
            >
              <defs>
                <linearGradient id="rkGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E8F94A" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#E8F94A" stopOpacity="0" />
                </linearGradient>
                <filter id="rkSoft" x="-20%" y="-40%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="5" />
                </filter>
              </defs>

              {/* dashed top rule */}
              <line
                x1={429}
                y1={197}
                x2={841}
                y2={197}
                stroke="rgba(255,255,255,.2)"
                strokeWidth="1"
                strokeDasharray="3 4"
              />

              {/* soft glow under the wave */}
              <path
                d={`${smoothPath(WAVE)} L 824 300 L 432 300 Z`}
                fill="url(#rkGlow)"
                filter="url(#rkSoft)"
                opacity="0.75"
              />

              {/* comb */}
              {TICKS.map(([x, top]) => (
                <line
                  key={`t${x}`}
                  x1={x}
                  y1={top}
                  x2={x}
                  y2={300}
                  stroke="rgba(255,255,255,.92)"
                  strokeWidth="2.1"
                />
              ))}

              {/* baseline rule under the comb */}
              <line x1={429} y1={305} x2={824} y2={305} stroke="rgba(255,255,255,.16)" strokeWidth="1" />

              {/* lower ticks */}
              {TICKS.map(([x]) => (
                <line
                  key={`l${x}`}
                  x1={x}
                  y1={311}
                  x2={x}
                  y2={321}
                  stroke={x === CURSOR_X ? "#1b2626" : "rgba(35,50,50,.42)"}
                  strokeWidth={x === CURSOR_X ? 2.2 : 1.3}
                />
              ))}

              {/* cursor */}
              <line x1={CURSOR_X} y1={256} x2={CURSOR_X} y2={300} stroke="#E8F94A" strokeWidth="2.2" />

              {/* wave */}
              <path d={smoothPath(WAVE)} stroke="#E8F94A" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>

            {/* ---- tooltip ---- */}
            <A
              l={665}
              t={180}
              w={86}
              h={67}
              style={{
                borderRadius: 12,
                background: "linear-gradient(180deg, rgba(238,243,232,.82), rgba(233,241,214,.74))",
                boxShadow: "0 10px 22px -12px rgba(30,45,45,.35)",
              }}
            >
              <A l={10} t={9} style={{ fontSize: 8.2, fontWeight: 700, color: "#1e2a2a", whiteSpace: "nowrap" }}>
                June 20, 2024
              </A>
              {[
                ["256", "calls answered", false],
                ["50", "calls missed", false],
                ["320", "calls prediction", true],
              ].map(([n, label, hi], i) => (
                <A key={n as string} l={7} t={24 + i * 12.5} w={78} h={12}>
                  {hi ? (
                    <div
                      style={{
                        position: "absolute",
                        inset: "-1px 0 0 0",
                        borderRadius: 4,
                        background: "rgba(232,249,74,.34)",
                      }}
                    />
                  ) : null}
                  <div style={{ position: "relative", paddingLeft: 3, fontSize: 7.4, whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 800, color: "#1c2727", marginRight: 3 }}>{n as string}</span>
                    <span style={{ fontWeight: 600, color: "rgba(35,46,46,.42)" }}>{label as string}</span>
                  </div>
                </A>
              ))}
            </A>
          </div>

          {/* ============================ TABS ============================ */}
          {tabs.map(([label, x]) => {
            const active = label === "CSAT Surveys";
            return (
              <A
                key={label}
                l={x as number}
                t={386}
                className="rk-nav"
                style={{
                  color: active ? "#1c2727" : "rgba(35,46,46,.5)",
                  fontWeight: active ? 800 : 600,
                  fontSize: 8.2,
                }}
              >
                {label}
                {active ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -6,
                      height: 1.6,
                      background: "#1c2727",
                    }}
                  />
                ) : null}
              </A>
            );
          })}
          <A l={843} t={385} w={12} h={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="3" height="12" viewBox="0 0 3 12" fill="rgba(35,46,46,.55)">
              <circle cx="1.5" cy="1.6" r="1.2" />
              <circle cx="1.5" cy="6" r="1.2" />
              <circle cx="1.5" cy="10.4" r="1.2" />
            </svg>
          </A>

          {/* ============================ BOTTOM CARD ============================ */}
          <div className="rk-card2">
            <div className="rk-divider" style={{ left: 291, top: 14, height: 156 }} />
            <div className="rk-divider" style={{ left: 442, top: 14, height: 156 }} />
            <div className="rk-col4" />

            {/* ---------- column 1 ---------- */}
            <A l={14} t={18} className="rk-kicker">
              Agents performance
            </A>
            <A l={264} t={17} w={12} h={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoExpand size={9.5} sw={1.8} color="rgba(35,46,46,.6)" />
            </A>
            <A l={14} t={33} className="rk-title" style={{ fontSize: 12.6 }}>
              Customer+VI ratings
            </A>

            <A l={14} t={64} className="rk-kicker" style={{ fontSize: 7.4 }}>
              Agents
            </A>
            <A l={186} t={64} className="rk-kicker" style={{ fontSize: 7.4 }}>
              CSAT
            </A>
            <A l={228} t={64} className="rk-kicker" style={{ fontSize: 7.4 }}>
              Calls rated
            </A>
            <div className="rk-hr" style={{ left: 14, top: 82, width: 258 }} />

            {[
              { name: "Adam Williams", team: "Team A", csat: "96%", calls: "35", img: "/lab/rinesk/avatar-adam.jpg", pos: "50% 20%" },
              { name: "Emily Carter", team: "Team B", csat: "75%", calls: "37", img: "/lab/rinesk/avatar-emily.jpg", pos: "50% 18%" },
            ].map((r, i) => (
              <div key={r.name}>
                <A l={14} t={99 + i * 41} w={24} h={24} style={{ borderRadius: 8, overflow: "hidden", background: "rgba(255,255,255,.45)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rk-avatar" src={r.img} alt="" width={24} height={24} style={{ width: 24, height: 24, objectPosition: r.pos }} />
                </A>
                <A l={46} t={100 + i * 41} style={{ fontSize: 10.2, fontWeight: 700, letterSpacing: -0.15, color: "#1e2a2a", whiteSpace: "nowrap" }}>
                  {r.name}
                </A>
                <A l={46} t={113 + i * 41} style={{ fontSize: 7.4, fontWeight: 600, color: "rgba(35,46,46,.5)" }}>
                  {r.team}
                </A>
                <A l={166} t={105 + i * 41} w={40} style={{ fontSize: 10, fontWeight: 600, color: "#22302f", textAlign: "right" }}>
                  {r.csat}
                </A>
                <A l={232} t={105 + i * 41} w={40} style={{ fontSize: 10, fontWeight: 600, color: "#22302f", textAlign: "right" }}>
                  {r.calls}
                </A>
              </div>
            ))}

            {/* ---------- column 2 ---------- */}
            <A l={309} t={18} className="rk-kicker">
              CSAT
            </A>
            <A l={307} t={30} style={{ fontSize: 25, fontWeight: 400, letterSpacing: -1, color: "#1b2727", lineHeight: "30px" }}>
              98
              <span style={{ fontSize: 13, fontWeight: 500 }}>%</span>
            </A>
            <svg width="122" height="60" viewBox="0 0 122 60" style={{ position: "absolute", left: 300, top: 74 }} fill="none">
              <defs>
                <linearGradient id="rkCsatArc" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="42%" stopColor="#E8F94A" />
                  <stop offset="100%" stopColor="#E8F94A" />
                </linearGradient>
              </defs>
              <path d="M2 58 C 14 6, 108 6, 120 58" stroke="rgba(255,255,255,.22)" strokeWidth="1" />
              <path d="M2 58 C 14 8, 102 6, 118 48" stroke="url(#rkCsatArc)" strokeWidth="2.1" strokeLinecap="round" />
            </svg>
            <A l={334} t={124} className="rk-kicker" style={{ fontSize: 7.4, color: "rgba(35,46,46,.55)" }}>
              Satisfied
            </A>
            <div className="rk-hr" style={{ left: 300, top: 143, width: 130 }} />
            <A l={309} t={152} className="rk-kicker" style={{ fontSize: 8 }}>
              Response Rate
            </A>

            {/* ---------- column 3 ---------- */}
            <A l={452} t={18} className="rk-kicker">
              CSAT Over Time
            </A>
            <A l={663} t={17} className="rk-kicker" style={{ fontSize: 7.6 }}>
              Week
            </A>
            <A l={689} t={18} w={10} h={10} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoChevron size={9} sw={2} color="rgba(35,46,46,.55)" />
            </A>
            {[
              ["Customer", "#E8F94A", 0],
              ["VI", "rgba(255,255,255,.9)", 1],
            ].map(([label, color, i]) => (
              <div key={label as string}>
                <A l={452} t={38 + (i as number) * 12} w={4.6} h={4.6} style={{ borderRadius: 99, background: color as string }} />
                <A l={464} t={33.5 + (i as number) * 12} style={{ fontSize: 7.6, fontWeight: 600, color: "rgba(35,46,46,.6)" }}>
                  {label as string}
                </A>
              </div>
            ))}
            <svg width="266" height="62" viewBox="0 0 266 62" style={{ position: "absolute", left: 450, top: 50 }} fill="none">
              {BARS.map(([h, y], i) => (
                <line
                  key={i}
                  x1={4 + i * 5.75}
                  y1={60 - h * 0.86}
                  x2={4 + i * 5.75}
                  y2={60}
                  stroke={y ? "#E8F94A" : "rgba(255,255,255,.85)"}
                  strokeWidth="2.1"
                />
              ))}
            </svg>
            {[
              ["Jun 1", 452],
              ["Jun 8", 528],
              ["Jun 16", 596],
              ["Jun 30", 670],
            ].map(([l, x]) => (
              <A key={l as string} l={x as number} t={116} style={{ fontSize: 7.6, fontWeight: 600, color: "rgba(35,46,46,.5)" }}>
                {l as string}
              </A>
            ))}
            <div className="rk-hr" style={{ left: 452, top: 143, width: 262 }} />
            <A l={452} t={152} className="rk-kicker" style={{ fontSize: 8 }}>
              Handled Calls
            </A>
            <A l={700} t={151} w={12} h={12} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IcoExpand size={9.5} sw={1.8} color="rgba(35,46,46,.6)" />
            </A>

            {/* ---------- column 4 ---------- */}
            <A l={742} t={18} className="rk-kicker">
              Prediction rate
            </A>
            <A l={742} t={33} className="rk-title" style={{ fontSize: 12.6 }}>
              CSAT VI powered
            </A>
            {[
              ["Answered", "516 calls", "rgba(255,255,255,.9)"],
              ["Inbound", "1k calls", "rgba(255,255,255,.45)"],
            ].map(([label, val, dot], i) => (
              <div key={label as string}>
                <A l={742} t={87 + i * 15} w={4.6} h={4.6} style={{ borderRadius: 99, background: dot as string }} />
                <A l={754} t={82 + i * 15} style={{ fontSize: 8.2, fontWeight: 600, color: "rgba(35,46,46,.6)" }}>
                  {label as string}
                </A>
                <A l={790} t={82 + i * 15} w={68} style={{ fontSize: 8.2, fontWeight: 800, color: "#1c2727", textAlign: "right" }}>
                  {val as string}
                </A>
              </div>
            ))}
            <svg width="130" height="52" viewBox="0 0 130 52" style={{ position: "absolute", left: 736, top: 118 }} fill="none">
              <path d="M4 50 C 20 4, 110 4, 126 50" stroke="rgba(255,255,255,.26)" strokeWidth="1" />
              <path d="M22 40 C 40 8, 92 8, 112 38" stroke="rgba(255,255,255,.95)" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <A l={766} t={158} style={{ fontSize: 8, fontWeight: 600, color: "rgba(35,46,46,.55)" }}>
              + 2% vs. last month
            </A>
          </div>
        </div>
      </div>
    </div>
  );
}
