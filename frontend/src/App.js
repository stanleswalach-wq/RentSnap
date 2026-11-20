import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import DashboardLayout from "@/pages/DashboardLayout";
import PropertiesPage from "@/pages/PropertiesPage";
import LeasePage from "@/pages/LeasePage";
import DepositPage from "@/pages/DepositPage";
import ProtocolPage from "@/pages/ProtocolPage";
import UtilitiesPage from "@/pages/UtilitiesPage";
import ForgotPassword from './pages/ForgotPassword';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="font-display uppercase tracking-tight text-2xl text-ink animate-pulse">LOKUM.PDF</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/logowanie" replace />;
  return children;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/logowanie" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/panel"
              element={
                <Protected>
                  <DashboardLayout />
                </Protected>
              }
            >
              <Route index element={<PropertiesPage />} />
              <Route path="umowa" element={<LeasePage />} />
              <Route path="kaucja" element={<DepositPage />} />
              <Route path="protokol" element={<ProtocolPage />} />
              <Route path="media" element={<UtilitiesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </div>
  );
}

export default App;
