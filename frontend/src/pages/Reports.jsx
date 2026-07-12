import { useEffect, useMemo, useState } from "react";
import { Chart } from "primereact/chart";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { dashboardApi, allocationsApi, maintenanceApi } from "../api";

const chartOptions = {
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { size: 11, weight: "500" } } },
    y: { grid: { color: "rgba(255,255,255,0.06)" }, ticks: { color: "#94a3b8", font: { size: 11, weight: "500" } } },
  },
  maintainAspectRatio: false,
};

function ListCard({ title, items }) {
  return (
    <div className="af-glass rounded-2xl p-5 border border-white/5">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-slate-500 italic">Nothing to show yet.</p>
      ) : (
        <ul className="space-y-2.5 text-xs text-slate-300">
          {items.map((m, idx) => (
            <li key={idx} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Reports() {
  const [charts, setCharts] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([dashboardApi.getCharts(), allocationsApi.getAllocations(), maintenanceApi.getMaintenance()])
      .then(([c, al, m]) => {
        setCharts(c);
        setAllocations(al || []);
        setMaintenance(m || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const mostUsed = useMemo(() => {
    const counts = {};
    allocations.forEach((a) => {
      const key = a.asset ? `${a.asset.assetTag} — ${a.asset.assetName}` : null;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => `${label} — ${count} checkout${count > 1 ? "s" : ""}`);
  }, [allocations]);

  const dueMaintenance = useMemo(
    () =>
      maintenance
        .filter((m) => m.status !== "Completed")
        .slice(0, 5)
        .map((m) => `${m.asset?.assetTag} ${m.asset?.assetName} — ${m.issue} (${m.priority})`),
    [maintenance]
  );

  const statusChart = charts
    ? {
        labels: charts.assetsByStatus.map((s) => s.label),
        datasets: [
          {
            data: charts.assetsByStatus.map((s) => s.value),
            backgroundColor: ["#10b981", "#6366f1", "#f59e0b", "#f43f5e", "#64748b", "#475569"],
            borderRadius: 6,
            maxBarThickness: 28,
          },
        ],
      }
    : null;

  const categoryChart = charts
    ? {
        labels: charts.assetsByCategory.map((c) => c.label),
        datasets: [
          {
            data: charts.assetsByCategory.map((c) => c.value),
            backgroundColor: ["#6366f1", "#a855f7", "#ec4899", "#10b981", "#3b82f6", "#f59e0b"],
            borderRadius: 6,
            maxBarThickness: 28,
          },
        ],
      }
    : null;

  const handleExport = () => {
    const rows = [
      ["Metric", "Value"],
      ...(charts?.assetsByStatus.map((s) => [`Status: ${s.label}`, s.value]) || []),
      ...(charts?.assetsByCategory.map((c) => [`Category: ${c.label}`, c.value]) || []),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "assetflow-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-indigo-400">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Message severity="error" text={error} className="mb-4 w-full justify-start" />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="af-glass rounded-2xl p-6 border border-white/5">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-300">Assets by Status</h2>
          <div style={{ height: 200 }}>
            {statusChart && <Chart type="bar" data={statusChart} options={chartOptions} style={{ height: "100%" }} />}
          </div>
        </div>

        <div className="af-glass rounded-2xl p-6 border border-white/5">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-300">Assets by Category</h2>
          <div style={{ height: 200 }}>
            {categoryChart && <Chart type="bar" data={categoryChart} options={chartOptions} style={{ height: "100%" }} />}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <ListCard title="Most checkout assets" items={mostUsed} />
        <ListCard title="Open maintenance queue" items={dueMaintenance} />
        <ListCard
          title="By priority"
          items={(charts?.maintenanceByPriority || []).map((p) => `${p.label} — ${p.value} request${p.value === 1 ? "" : "s"}`)}
        />
      </div>

      <div className="flex justify-end">
        <Button label="Export Report (CSV)" icon="pi pi-download" onClick={handleExport} />
      </div>
    </div>
  );
}

export default Reports;
