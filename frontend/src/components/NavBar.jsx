function NavBar({ title, subtitle, user }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-100">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="af-glass flex items-center gap-2.5 rounded-full px-3.5 py-1.5 border border-white/5">
        <i className="pi pi-user text-xs text-indigo-300" />
        <span className="text-xs font-semibold text-slate-200">{user?.name || "Account"}</span>
        {user?.role && (
          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
            {user.role}
          </span>
        )}
      </div>
    </div>
  );
}

export default NavBar;
