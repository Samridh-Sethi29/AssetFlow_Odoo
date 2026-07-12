// Static UI configuration (navigation labels, page headers).
// All record data (assets, departments, allocations, etc.) is now
// fetched live from the backend API — see src/api/.

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "pi pi-th-large" },
  { key: "org", label: "Organization setup", icon: "pi pi-building" },
  { key: "assets", label: "Assets", icon: "pi pi-box" },
  { key: "allocation", label: "Allocation & Transfer", icon: "pi pi-arrow-right-arrow-left" },
  { key: "booking", label: "Resource Booking", icon: "pi pi-calendar" },
  { key: "maintenance", label: "Maintenance", icon: "pi pi-wrench" },
  { key: "audit", label: "Audit", icon: "pi pi-verified" },
  { key: "reports", label: "Reports", icon: "pi pi-chart-bar" },
  { key: "notifications", label: "Notifications", icon: "pi pi-bell" },
];

export const PAGE_META = {
  dashboard: { title: "Today's overview", subtitle: null },
  org: { title: "Organization setup", subtitle: "Admin only" },
  assets: { title: "Asset registrations and directory", subtitle: null },
  allocation: { title: "Asset allocation & transfer", subtitle: null },
  booking: { title: "Resource booking", subtitle: null },
  maintenance: { title: "Maintenance management", subtitle: "Live requests from the maintenance queue" },
  audit: { title: "Asset audit", subtitle: null },
  reports: { title: "Reports & analytics", subtitle: null },
  notifications: { title: "Activity logs & notifications", subtitle: null },
};
