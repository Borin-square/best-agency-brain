export default function OverviewPage() {
  return (
    <div>
      <h1>Overview</h1>
      <p className="muted">KPI overview (in arrivo).</p>

      <div className="grid-4" style={{ marginTop: 20 }}>
        <div className="cd">
          <div className="lb">Agenzie totali</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>—</div>
        </div>
        <div className="cd">
          <div className="lb">Verified</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>—</div>
        </div>
        <div className="cd">
          <div className="lb">MRR</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>—</div>
        </div>
        <div className="cd">
          <div className="lb">Agent runs 24h</div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>—</div>
        </div>
      </div>
    </div>
  );
}
