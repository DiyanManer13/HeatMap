import { BarChart3, Download, FileText, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import "./Reports.css";

type DispatchMetrics = {
  completedOrders: number;
  lateDeliveries: number;
  ridersOverHeatLimit: number;
  softLimitOverrides: number;
  deliveryEarnings: number;
  pauseCredits: number;
  averageEarningsPerHeatPoint: number;
};

type DailyReport = {
  summary: {
    seed: number;
    generatedAt: string;
    baseline: DispatchMetrics;
    heatAware: DispatchMetrics;
  };
  report: string;
};

const metricRows: { key: keyof DispatchMetrics; label: string }[] = [
  { key: "completedOrders", label: "Completed orders" },
  { key: "lateDeliveries", label: "Late deliveries" },
  { key: "ridersOverHeatLimit", label: "Riders over heat limit" },
  { key: "softLimitOverrides", label: "Soft-limit overrides" },
  { key: "deliveryEarnings", label: "Delivery earnings" },
  { key: "pauseCredits", label: "Pause credits" },
  { key: "averageEarningsPerHeatPoint", label: "Earnings per heat point" },
];

const formatMetric = (key: keyof DispatchMetrics, value: number) => {
  if (key === "deliveryEarnings" || key === "pauseCredits") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
  }
  if (key === "averageEarningsPerHeatPoint") {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
  }
  return new Intl.NumberFormat("en-IN").format(value);
};

const ComparisonBar = ({ label, baseline, heatAware, format = (value: number) => value.toLocaleString("en-IN") }: {
  label: string;
  baseline: number;
  heatAware: number;
  format?: (value: number) => string;
}) => {
  const maximum = Math.max(baseline, heatAware, 1);
  return (
    <div className="report-chart-row">
      <div className="report-chart-values"><strong>{label}</strong><span>Baseline {format(baseline)} · Pause Pay {format(heatAware)}</span></div>
      <div className="report-bar-pair" role="img" aria-label={`${label}: baseline ${format(baseline)}, Pause Pay ${format(heatAware)}`}>
        <div className="report-bar-track"><i className="baseline-bar" style={{ width: `${baseline / maximum * 100}%` }} /></div>
        <div className="report-bar-track"><i className="heatbudget-bar" style={{ width: `${heatAware / maximum * 100}%` }} /></div>
      </div>
      <div className="report-bar-labels"><span>Baseline</span><span>Pause Pay</span></div>
    </div>
  );
};

export const Reports = () => {
  const [data, setData] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [seedInput, setSeedInput] = useState("440026");
  const [seed, setSeed] = useState(440026);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`/api/v1/reports/daily?seed=${seed}`)
      .then((response) => {
        if (!response.ok) throw new Error("Could not load the dispatch report.");
        return response.json() as Promise<DailyReport>;
      })
      .then((report) => { if (!cancelled) setData(report); })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Could not load the dispatch report.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [retry, seed]);

  const generateReport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedSeed = Number(seedInput);
    if (!Number.isSafeInteger(parsedSeed) || parsedSeed < 0) {
      setError("Enter a non-negative whole-number seed.");
      return;
    }
    if (parsedSeed === seed) setRetry((value) => value + 1);
    else setSeed(parsedSeed);
  };

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["metric", "baseline", "pause_pay"],
      ...metricRows.map(({ key, label }) => [
        label,
        String(data.summary.baseline[key]),
        String(data.summary.heatAware[key]),
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `pause-pay-report-${data.summary.seed}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <section className="reports-dashboard">
      <div className="reports-header">
        <div>
          <h2>Operations report</h2>
          <p>{data ? `Pune simulation · Seed ${data.summary.seed} · Generated ${new Date(data.summary.generatedAt).toLocaleString("en-IN")}` : "Seeded baseline vs Pause Pay results"}</p>
        </div>
        <div className="reports-actions">
          <form className="report-run-form" onSubmit={generateReport}>
            <label htmlFor="report-seed">Scenario seed</label>
            <input id="report-seed" inputMode="numeric" value={seedInput} onChange={(event) => setSeedInput(event.target.value)} />
            <button className="report-generate-btn" type="submit" disabled={loading}>
              <RefreshCw size={15} className={loading ? "refresh-spinning" : ""} /> Generate
            </button>
          </form>
          <button className="download-btn" onClick={exportCsv} disabled={!data}>
            <Download size={16} /> Export report CSV
          </button>
        </div>
      </div>

      {loading && <div className="report-state" role="status">Loading dispatch report…</div>}
      {error && (
        <div className="report-state report-error" role="alert">
          <p>{error}</p>
          <button className="download-btn" onClick={() => setRetry((value) => value + 1)}>Retry</button>
        </div>
      )}
      {data && (
        <>
          <div className="report-kpis">
            <article><span>Orders completed</span><strong>{data.summary.heatAware.completedOrders.toLocaleString("en-IN")}</strong><small>Across both strategies</small></article>
            <article><span>Pause Pay late rate</span><strong>{data.summary.heatAware.completedOrders ? `${(data.summary.heatAware.lateDeliveries / data.summary.heatAware.completedOrders * 100).toFixed(1)}%` : "0%"}</strong><small>{data.summary.heatAware.lateDeliveries.toLocaleString("en-IN")} late orders</small></article>
            <article><span>Riders over heat limit</span><strong>{data.summary.heatAware.ridersOverHeatLimit.toLocaleString("en-IN")}</strong><small>Pause Pay scenario</small></article>
            <article><span>Pause credits</span><strong>{formatMetric("pauseCredits", data.summary.heatAware.pauseCredits)}</strong><small>Pause Pay scenario</small></article>
          </div>

          <section className="report-charts" aria-label="Operational comparison charts">
            <article className="report-chart-card">
              <header><div><p className="eyebrow">SERVICE LEVEL</p><h3>Late deliveries</h3></div><BarChart3 size={19} /></header>
              <ComparisonBar label="Late orders" baseline={data.summary.baseline.lateDeliveries} heatAware={data.summary.heatAware.lateDeliveries} />
              <ComparisonBar label="On-time orders" baseline={Math.max(0, data.summary.baseline.completedOrders - data.summary.baseline.lateDeliveries)} heatAware={Math.max(0, data.summary.heatAware.completedOrders - data.summary.heatAware.lateDeliveries)} />
              <p className="report-chart-note">Bars share a scale within each metric. Lower late-order counts are better.</p>
            </article>
            <article className="report-chart-card">
              <header><div><p className="eyebrow">RIDER ECONOMICS</p><h3>Earnings and credits</h3></div><BarChart3 size={19} /></header>
              <ComparisonBar label="Delivery earnings" baseline={data.summary.baseline.deliveryEarnings} heatAware={data.summary.heatAware.deliveryEarnings} format={(value) => formatMetric("deliveryEarnings", value)} />
              <ComparisonBar label="Pause credits" baseline={data.summary.baseline.pauseCredits} heatAware={data.summary.heatAware.pauseCredits} format={(value) => formatMetric("pauseCredits", value)} />
              <ComparisonBar label="Earnings per heat point" baseline={data.summary.baseline.averageEarningsPerHeatPoint} heatAware={data.summary.heatAware.averageEarningsPerHeatPoint} format={(value) => formatMetric("averageEarningsPerHeatPoint", value)} />
              <p className="report-chart-note">Pause credits are shown separately from delivery earnings.</p>
            </article>
            <article className="report-chart-card">
              <header><div><p className="eyebrow">SAFETY CONTROLS</p><h3>Heat-limit outcomes</h3></div><BarChart3 size={19} /></header>
              <ComparisonBar label="Riders over limit" baseline={data.summary.baseline.ridersOverHeatLimit} heatAware={data.summary.heatAware.ridersOverHeatLimit} />
              <ComparisonBar label="Soft-limit overrides" baseline={data.summary.baseline.softLimitOverrides} heatAware={data.summary.heatAware.softLimitOverrides} />
              {data.summary.baseline.ridersOverHeatLimit === 0 && data.summary.heatAware.ridersOverHeatLimit === 0 && (
                <p className="report-chart-note">No riders exceeded the configured limit in this seed.</p>
              )}
            </article>
          </section>

          <div className="report-section-title"><h3>Metric detail</h3><p>Same generated orders and seed for both strategies.</p></div>
          <div className="report-table-wrap">
            <table className="report-metrics">
              <thead><tr><th>Metric</th><th>Baseline</th><th>Pause Pay</th><th>Difference</th></tr></thead>
              <tbody>
                {metricRows.map(({ key, label }) => {
                  const baseline = data.summary.baseline[key];
                  const heatAware = data.summary.heatAware[key];
                  const difference = heatAware - baseline;
                  return (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>{formatMetric(key, baseline)}</td>
                      <td>{formatMetric(key, heatAware)}</td>
                      <td>{difference === 0 ? "No change" : `${difference > 0 ? "+" : "−"}${formatMetric(key, Math.abs(difference))}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <article className="report-narrative">
            <h3><FileText size={18} /> Compliance summary</h3>
            <p>{data.report}</p>
          </article>
        </>
      )}
    </section>
  );
};
