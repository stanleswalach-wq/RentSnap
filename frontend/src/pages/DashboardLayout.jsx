import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { Building2, FileText, HandCoins, ClipboardCheck, Zap, LogOut, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { to: "/panel", end: true, label: "Moje lokale", icon: Building2, testid: "nav-properties" },
  { to: "/panel/umowa", label: "Umowa najmu", icon: FileText, testid: "nav-lease" },
  { to: "/panel/kaucja", label: "Potwierdzenie kaucji", icon: HandCoins, testid: "nav-deposit" },
  { to: "/panel/protokol", label: "Protokół zdawczy", icon: ClipboardCheck, testid: "nav-protocol" },
  { to: "/panel/media", label: "Rozliczenie mediów", icon: Zap, testid: "nav-utilities" },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-ground flex flex-col md:flex-row" data-testid="dashboard-layout">
      <aside className="md:w-64 bg-ink text-ground md:min-h-screen flex md:flex-col">
        <div className="p-5 border-b border-ground/10 flex md:block items-center justify-between w-full md:w-auto">
          <Link to="/" className="flex items-center gap-2.5" data-testid="dash-brand">
            <svg className="w-6 h-6" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" />
              <path d="M7 9h14M7 14h9M7 19h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-lg tracking-tight uppercase">LOKUM.PDF</span>
          </Link>
        </div>
        <nav className="flex md:flex-col flex-1 overflow-x-auto md:overflow-visible">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={item.testid}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3.5 text-xs uppercase tracking-wider font-semibold whitespace-nowrap transition-colors border-l-2 ${
                  isActive ? "bg-coal text-ground border-accent" : "text-ground/60 border-transparent hover:text-ground hover:bg-coal/60"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block p-5 border-t border-ground/10">
          <div className="text-xs text-ground/60 mb-1 truncate" data-testid="dash-user-email">{user?.email}</div>
          <div className="text-[10px] uppercase tracking-wider text-accent font-bold mb-3">Plan: {user?.plan === "trial" ? "Testowy" : user?.plan}</div>
          <button onClick={handleLogout} data-testid="logout-button" className="inline-flex items-center gap-2 text-xs text-ground/60 hover:text-ground transition-colors">
            <LogOut size={14} /> Wyloguj się
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
