import { NAV_ITEMS } from "../data/mockData";

function SideBar({ active, onNavigate, onLogout }) {
  return (
    <aside className="af-glass sticky top-0 h-screen w-64 shrink-0 rounded-none border-t-0 border-b-0 border-l-0 border-r border-white/5 p-5">
      <div className="mb-8 flex items-center gap-3 px-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-display text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
          NK
        </div>
        <span className="font-display text-base font-bold tracking-tight text-white">NexusKeep</span>
      </div>

      <nav className="space-y-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-200 border border-transparent ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 shadow-inner"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
              }`}
            >
              <i className={`${item.icon} text-[15px] ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="absolute bottom-5 left-5 right-5 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
      >
        <i className="pi pi-sign-out text-[15px]" />
        Sign out
      </button>
    </aside>
  );
}

export default SideBar;
