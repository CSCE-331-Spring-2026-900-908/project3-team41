import { useEffect, useMemo, useState } from "react";
import "../../styles/manager.css";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, "");

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatPct(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function defaultRange() {
  const today = new Date();
  const from = new Date();
  from.setDate(today.getDate() - 7);

  const pad = (n) => String(n).padStart(2, "0");
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  return { from: fmt(from), to: fmt(today) };
}

function PieChart({ rows }) {
  const total = rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0);
  const palette = ["#2f65cb", "#f06b2a", "#e7a11c", "#4eb15e", "#4d9bc2", "#7a52c1", "#d34f94"];

  const gradient = rows.length
    ? rows.reduce(
        (acc, row, index) => {
          const ratio = total > 0 ? Number(row.revenue || 0) / total : 0;
          const start = acc.cursor;
          const end = acc.cursor + ratio * 100;
          const color = palette[index % palette.length];
          acc.parts.push(`${color} ${start}% ${end}%`);
          acc.cursor = end;
          return acc;
        },
        { parts: [], cursor: 0 }
      ).parts.join(", ")
    : "#d8d8d8 0% 100%";

  return (
    <div className="analytics-pie-wrap">
      <div className="analytics-pie" style={{ backgroundImage: `conic-gradient(${gradient})` }}>
        <div className="analytics-pie-hole" />
      </div>

      <div className="analytics-pie-legend">
        {rows.map((row, index) => {
          const share = total > 0 ? Number(row.revenue || 0) / total : 0;
          return (
            <div key={row.category} className="analytics-legend-row">
              <span
                className="analytics-legend-color"
                style={{ background: palette[index % palette.length] }}
              />
              <span className="analytics-legend-text">
                {row.category} ({formatPct(share)})
              </span>
            </div>
          );
        })}
        {rows.length === 0 && <p className="muted">No category data in range.</p>}
      </div>
    </div>
  );
}

function HorizontalBars({ title, bars, valueLabel }) {
  const maxValue = bars.reduce((max, row) => Math.max(max, Number(row.value || 0)), 0);

  return (
    <div className="analytics-chart-panel">
      <h2 className="analytics-chart-title">{title}</h2>
      <div className="analytics-bars">
        {bars.map((row) => {
          const ratio = maxValue > 0 ? Number(row.value || 0) / maxValue : 0;
          return (
            <div key={row.label} className="analytics-bar-row">
              <div className="analytics-bar-meta">
                <span className="analytics-bar-label">{row.label}</span>
                <span className="analytics-bar-value">{valueLabel(row.value)}</span>
              </div>
              <div className="analytics-bar-track">
                <div className="analytics-bar-fill" style={{ width: `${Math.max(2, ratio * 100)}%` }} />
              </div>
            </div>
          );
        })}
        {bars.length === 0 && <p className="muted">No data in selected range.</p>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const rangeDefaults = defaultRange();
  const [fromDate, setFromDate] = useState(rangeDefaults.from);
  const [toDate, setToDate] = useState(rangeDefaults.to);
  const [chartType, setChartType] = useState("product");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [productUsage, setProductUsage] = useState([]);
  const [salesByItem, setSalesByItem] = useState([]);
  const [revenueByCategory, setRevenueByCategory] = useState([]);

  const [xReport, setXReport] = useState(null);
  const [zReport, setZReport] = useState(null);
  const [reportError, setReportError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);

  const loadOverview = async (startDate, endDate) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_URL}/api/manager/analytics/overview?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}`
      );
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || `Server responded ${res.status}`);
      }

      setProductUsage(Array.isArray(body.productUsage) ? body.productUsage : []);
      setSalesByItem(Array.isArray(body.salesByItem) ? body.salesByItem : []);
      setRevenueByCategory(Array.isArray(body.revenueByCategory) ? body.revenueByCategory : []);
    } catch (err) {
      setError(err.message || "Failed to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(fromDate, toDate);
  }, []);

  const applyRange = () => {
    loadOverview(fromDate, toDate);
  };

  const runXReport = async () => {
    try {
      setReportLoading(true);
      setReportError("");

      const res = await fetch(`${API_URL}/api/manager/reports/x`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Server responded ${res.status}`);
      }

      setXReport(body);
    } catch (err) {
      setReportError(err.message || "Failed to run X report.");
    } finally {
      setReportLoading(false);
    }
  };

  const runZReport = async () => {
    const confirmed = window.confirm(
      "Run end-of-day Z report? This can only be executed once per day."
    );
    if (!confirmed) {
      return;
    }

    try {
      setReportLoading(true);
      setReportError("");

      const res = await fetch(`${API_URL}/api/manager/reports/z`, { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || `Server responded ${res.status}`);
      }

      setZReport(body);
    } catch (err) {
      setReportError(err.message || "Failed to run Z report.");
    } finally {
      setReportLoading(false);
    }
  };

  const chartBars = useMemo(() => {
    if (chartType === "product") {
      return productUsage.slice(0, 12).map((row) => ({
        label: row.ingredientName,
        value: Number(row.usage || 0),
      }));
    }

    return salesByItem.slice(0, 12).map((row) => ({
      label: row.itemName,
      value: Number(row.revenue || 0),
    }));
  }, [chartType, productUsage, salesByItem]);

  return (
    <div className="manager-page analytics-page">
      <div className="manager-header analytics-header">
        <h1 className="manager-title">Analytics</h1>

        <div className="analytics-controls">
          <label className="analytics-control-label" htmlFor="analytics-from">
            From
          </label>
          <input
            id="analytics-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <label className="analytics-control-label" htmlFor="analytics-to">
            To
          </label>
          <input
            id="analytics-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />

          <button className="btn-secondary" onClick={applyRange}>
            Apply
          </button>
        </div>
      </div>

      <div className="analytics-toggle">
        <label>
          <input
            type="radio"
            name="analytics-chart"
            checked={chartType === "product"}
            onChange={() => setChartType("product")}
          />
          Product Usage
        </label>

        <label>
          <input
            type="radio"
            name="analytics-chart"
            checked={chartType === "sales"}
            onChange={() => setChartType("sales")}
          />
          Sales Usage
        </label>
      </div>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p className="muted">Loading analytics…</p>
      ) : (
        <div className="analytics-grid">
          <HorizontalBars
            title={
              chartType === "product"
                ? "Inventory Usage (selected timeframe)"
                : "Revenue By Menu Item (selected timeframe)"
            }
            bars={chartBars}
            valueLabel={chartType === "product" ? (v) => Number(v).toString() : formatMoney}
          />

          <div className="analytics-side-panel">
            <h2 className="analytics-chart-title">Revenue by Category</h2>
            <PieChart rows={revenueByCategory} />

            <div className="table-wrap analytics-table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByCategory.map((row) => (
                    <tr key={row.category}>
                      <td>{row.category}</td>
                      <td>{Number(row.sold || 0)}</td>
                      <td>{formatMoney(row.revenue)}</td>
                    </tr>
                  ))}
                  {revenueByCategory.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center muted">
                        No category revenue in range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-report-actions">
        <button className="btn-secondary" onClick={runXReport} disabled={reportLoading}>
          X Report
        </button>
        <button className="btn-danger" onClick={runZReport} disabled={reportLoading}>
          Z Report
        </button>
      </div>

      {reportError && <p className="error">{reportError}</p>}

      {(xReport || zReport) && (
        <div className="analytics-reports-grid">
          {xReport && (
            <div className="analytics-report-card">
              <h3>X Report ({xReport.businessDate})</h3>
              <div className="analytics-kpis">
                <span>Transactions: {xReport.totals.transactions}</span>
                <span>Items: {xReport.totals.itemsCount}</span>
                <span>Sales: {formatMoney(xReport.totals.salesTotal)}</span>
                <span>Avg Price: {formatMoney(xReport.totals.averagePrice)}</span>
                <span>Cash: {formatMoney(xReport.totals.cash)}</span>
                <span>Card: {formatMoney(xReport.totals.card)}</span>
              </div>

              <div className="table-wrap analytics-table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Hour</th>
                      <th>Txn</th>
                      <th>Items</th>
                      <th>Sales</th>
                      <th>Cash</th>
                      <th>Card</th>
                    </tr>
                  </thead>
                  <tbody>
                    {xReport.hourly.map((row) => (
                      <tr key={row.hour}>
                        <td>{String(row.hour).padStart(2, "0")}:00</td>
                        <td>{row.transactions}</td>
                        <td>{row.itemsCount}</td>
                        <td>{formatMoney(row.salesTotal)}</td>
                        <td>{formatMoney(row.cash)}</td>
                        <td>{formatMoney(row.card)}</td>
                      </tr>
                    ))}
                    {xReport.hourly.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center muted">
                          No sales yet today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {zReport && (
            <div className="analytics-report-card">
              <h3>Z Report ({zReport.businessDate})</h3>
              <p className="muted">Generated: {new Date(zReport.generatedAt).toLocaleString()}</p>
              <div className="analytics-kpis">
                <span>Transactions: {zReport.totals.transactions}</span>
                <span>Items: {zReport.totals.itemsCount}</span>
                <span>Sales: {formatMoney(zReport.totals.salesTotal)}</span>
                <span>Avg Price: {formatMoney(zReport.totals.averagePrice)}</span>
                <span>Cash: {formatMoney(zReport.totals.cash)}</span>
                <span>Card: {formatMoney(zReport.totals.card)}</span>
              </div>
              <p className="muted">{zReport.sideEffect}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}