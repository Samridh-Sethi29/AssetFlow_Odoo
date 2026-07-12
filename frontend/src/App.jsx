import { lazy, Suspense, useState } from "react";
import SideBar from "./components/SideBar";
import NavBar from "./components/NavBar";
import { PAGE_META } from "./data/mockData";
import { useAuth } from "./context/useAuth";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Organization = lazy(() => import("./pages/Organization"));
const Assets = lazy(() => import("./pages/Assets"));
const Allocation = lazy(() => import("./pages/Allocation"));
const ResourceBooking = lazy(() => import("./pages/ResourceBooking"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Audit = lazy(() => import("./pages/Audit"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));

const SCREENS = {
  dashboard: Dashboard,
  org: Organization,
  assets: Assets,
  allocation: Allocation,
  booking: ResourceBooking,
  maintenance: Maintenance,
  audit: Audit,
  reports: Reports,
  notifications: Notifications,
};

function App() {
  const { user, loading, logout } = useAuth();
  const [screen, setScreen] = useState("dashboard");

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#080c14]">
        <i className="pi pi-spin pi-spinner text-2xl text-indigo-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden bg-[#080c14]">
        <BackgroundBlobs />
        <Suspense fallback={<LoadingIndicator />}>
          <LoginPage />
        </Suspense>
      </div>
    );
  }

  const ActiveScreen = SCREENS[screen];
  const meta = PAGE_META[screen];

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#080c14]">
      <BackgroundBlobs />
      <div className="relative flex">
        <SideBar active={screen} onNavigate={setScreen} onLogout={logout} />
        <main className="min-h-screen flex-1 overflow-y-auto px-10 py-8">
          <div className="mx-auto max-w-5xl">
            <NavBar title={meta.title} subtitle={meta.subtitle} user={user} />
            <Suspense fallback={<LoadingIndicator />}>
              <ActiveScreen onNavigate={setScreen} />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}

function BackgroundBlobs() {
  return (
    <>
      <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-indigo-900/20 blur-[100px]" />
      <div className="pointer-events-none absolute top-1/3 -right-32 h-[28rem] w-[28rem] rounded-full bg-purple-900/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-emerald-950/20 blur-[90px]" />
    </>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex min-h-32 items-center justify-center">
      <i className="pi pi-spin pi-spinner text-xl text-indigo-400" />
    </div>
  );
}

export default App;
