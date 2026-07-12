import { useEffect, useState } from "react";
import { activityApi } from "../api";

const TABS = ["All", "Auth", "Asset", "Allocation", "Booking", "Maintenance", "Audit"];

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Notifications() {
  const [tab, setTab] = useState("All");
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    const request = tab === "All" ? activityApi.getActivity({ limit: 50 }) : activityApi.getActivityByModule(tab);
    request
      .then((data) => setActivity(tab === "All" ? data.activities || [] : data || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tab]);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
              tab === t
                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/25 shadow-inner"
                : "text-slate-400 bg-transparent border-transparent hover:bg-white/5 hover:text-slate-100"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Activity Log list */}
      <div className="af-glass divide-y divide-white/5 rounded-2xl border border-white/5 p-1.5">
        {loading ? (
          <div className="px-4 py-12 text-center text-sm text-indigo-400">
            <i className="pi pi-spin pi-spinner mr-2 text-xl" />Loading activity feed...
          </div>
        ) : activity.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500 italic">No activity logs recorded.</div>
        ) : (
          activity.map((n) => (
            <div key={n._id} className="flex items-center justify-between px-4 py-3.5 hover:bg-white/[0.01] transition-all">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 shrink-0 rounded-full ${n.module === 'Auth' ? 'bg-indigo-400' : n.module === 'Asset' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <p className="text-sm text-slate-300">
                  {n.description || `${n.action} — ${n.module}`}
                  {n.user?.name ? (
                    <span className="text-xs text-slate-500 font-semibold ml-2">by {n.user.name}</span>
                  ) : null}
                </p>
              </div>
              <span className="shrink-0 pl-4 text-xs text-slate-500 font-semibold">{timeAgo(n.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notifications;
