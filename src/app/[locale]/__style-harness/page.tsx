import "../app/app.css";

export default function StyleHarness() {
  return (
    <div className="viq-app app-page min-h-screen p-10 space-y-6">
      <h1 className="text-2xl">Workspace surfaces</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="app-card p-4">
          <p className="app-label mb-2">Carbon footprint</p>
          <span className="app-metric text-[1.75rem]">128.4 tCO2e</span>
          <p className="app-meta mt-2">Down 6.2% against last quarter</p>
        </div>
        <div className="app-card-inset p-4">Inset surface</div>
        <div className="app-overlay p-4">Overlay surface</div>
      </div>
      <div className="flex gap-3">
        <span className="app-tag">Neutral</span>
        <span className="app-tag" data-tone="positive">On track</span>
        <span className="app-tag" data-tone="caution">Review</span>
        <span className="app-tag" data-tone="critical">Overdue</span>
      </div>
      <div className="flex gap-3">
        <button className="app-btn">Primary action</button>
        <button className="app-btn app-btn-ghost">Secondary</button>
      </div>
      <div className="app-ledger">
        <div className="p-4">CSRD Wave 3 — 176 days</div>
        <div className="p-4">CBAM definitive — in force</div>
      </div>
    </div>
  );
}
