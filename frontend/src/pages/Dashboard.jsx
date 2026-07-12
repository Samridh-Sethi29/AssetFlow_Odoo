import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { Chart } from "primereact/chart";
import { dashboardApi } from "../api";

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([dashboardApi.getStats(), dashboardApi.getActivityFeed(8)])
      .then(([statsData, activityData]) => {
        if (cancelled) return;
        setStats(statsData);
        setActivity(activityData || []);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = stats
    ? {
        labels: ["Available", "Allocated", "Maintenance", "Disposed"],
        datasets: [
          {
            data: [
              stats.availableAssets || 0,
              stats.allocatedAssets || 0,
              stats.maintenanceAssets || 0,
              stats.disposedAssets || 0,
            ],
            backgroundColor: ["#10b981", "#6366f1", "#f59e0b", "#f43f5e"],
            hoverBackgroundColor: ["#34d399", "#818cf8", "#fbbf24", "#fda4af"],
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      }
    : null;

  const chartOptions = {
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#94a3b8",
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 12, weight: "600" },
          padding: 16,
        },
      },
    },
    cutout: "75%",
    maintainAspectRatio: false,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-indigo-400">
        <i className="pi pi-spin pi-spinner mr-2 text-xl" /> Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        Couldn't load dashboard data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="af-glass af-glow-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Assets</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <i className="pi pi-box text-sm" />
            </div>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold text-white">{stats?.totalAssets}</p>
        </div>

        <div className="af-glass af-glow-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Allocations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <i className="pi pi-arrow-right-arrow-left text-sm" />
            </div>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold text-white">{stats?.activeAllocations}</p>
        </div>

        <div className="af-glass af-glow-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">In Maintenance</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <i className="pi pi-wrench text-sm" />
            </div>
          </div>
          <p className="mt-3 font-display text-4xl font-extrabold text-white">{stats?.maintenanceAssets}</p>
        </div>
      </div>

      {/* Flagged Overdues */}
      {stats?.overdueAllocations > 0 && (
        <div className="flex items-center gap-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3.5">
          <i className="pi pi-exclamation-triangle text-rose-400 text-lg" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-300">
              {stats.overdueAllocations} asset{stats.overdueAllocations > 1 ? "s are" : " is"} overdue for return!
            </p>
            <p className="text-xs text-rose-400/80">Flagged for follow-up immediately.</p>
          </div>
          <Button label="View" size="small" className="!bg-rose-500/20 hover:!bg-rose-500/30 text-rose-300 border border-rose-500/30 shadow-none !py-1.5 !px-3" onClick={() => onNavigate("allocation")} />
        </div>
      )}

      {/* Main Content Split: Chart & Actions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Donut Chart */}
        <div className="af-glass rounded-2xl p-6 md:col-span-8">
          <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-slate-300">Asset Status Breakdown</h2>
          <div className="relative flex items-center justify-center" style={{ height: 210 }}>
            {chartData && <Chart type="doughnut" data={chartData} options={chartOptions} className="w-full h-full" />}
          </div>
        </div>

        {/* Quick Actions & KPIs */}
        <div className="af-glass rounded-2xl p-6 md:col-span-4 flex flex-col justify-between">
          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-300">Quick Actions</h2>
            <div className="flex flex-col gap-2.5">
              <Button label="Register Asset" icon="pi pi-plus" className="w-full text-left" onClick={() => onNavigate("assets")} />
              <Button label="Book Resource" icon="pi pi-calendar" outlined className="w-full" onClick={() => onNavigate("booking")} />
              <Button label="Manage Allocations" icon="pi pi-arrow-right" outlined className="w-full" onClick={() => onNavigate("allocation")} />
            </div>
          </div>
          <div className="mt-6 pt-5 border-t border-white/5 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Pending Bookings</span>
              <span className="font-bold text-slate-200">{stats?.pendingBookings}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Open Maintenance</span>
              <span className="font-bold text-slate-200">{stats?.openMaintenance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="af-glass rounded-2xl p-6">
        <h2 className="mb-5 text-sm font-bold uppercase tracking-wider text-slate-300">Recent System Activity</h2>
        {activity.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No activity logged yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {activity.map((a) => (
              <li key={a._id} className="flex items-center justify-between py-3.5 text-sm">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${a.action === 'CREATE' ? 'bg-emerald-500' : a.action === 'COMPLETE' ? 'bg-indigo-500' : 'bg-slate-500'}`} />
                  <span className="text-slate-300">
                    {a.description || `${a.action} — ${a.module}`}
                    {a.user?.name ? (
                      <span className="text-xs text-slate-500 font-medium ml-2">by {a.user.name}</span>
                    ) : null}
                  </span>
                </div>
                <span className="shrink-0 pl-4 text-xs text-slate-500 font-medium">{timeAgo(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
