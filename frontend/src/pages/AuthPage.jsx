import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiError } from "@/context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") await register(name, email, password);
      else await login(email, password);
      navigate("/panel");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ground flex" data-testid="auth-page">
      <div className="hidden lg:flex lg:w-1/2 bg-ink text-ground flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-3" data-testid="auth-brand">
          <svg className="w-7 h-7" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="2" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" />
            <path d="M7 9h14M7 14h9M7 19h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
          <span className="font-display text-2xl tracking-tight uppercase">LOKUM.PDF</span>
        </Link>
        <div>
          <h1 className="font-display uppercase text-6xl leading-[0.92]">
            <span className="ln"><span>Najem bez</span></span>
            <span className="ln"><span>chaosu.</span></span>
          </h1>
          <p className="mt-6 text-ground/70 max-w-sm text-sm leading-relaxed">
            Umowy najmu, protokoły zdawczo-odbiorcze, potwierdzenia kaucji i rozliczenia mediów — jako gotowy PDF w kilka minut.
          </p>
        </div>
        <div className="text-xs text-ground/40 font-mono-num">CAŁA POLSKA · PLATFORM SAAS DLA WYNAJMU</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="font-display uppercase text-3xl" data-testid="auth-title">
              {mode === "register" ? "Załóż konto" : "Zaloguj się"}
            </h2>
            <p className="text-sm text-ink/60 mt-2">
              {mode === "register"
                ? "Darmowy dostęp testowy — wygeneruj pierwszy dokument w 3 minuty."
                : "Witaj z powrotem w panelu LOKUM.PDF."}
            </p>
          </div>

          <div className="flex bg-cream rounded p-1 mb-6">
            {["register", "login"].map((m) => (
              <button
                key={m}
                type="button"
                data-testid={`auth-mode-${m}`}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 text-xs uppercase tracking-wider font-bold py-2.5 rounded transition-colors ${mode === m ? "bg-ink text-ground" : "text-ink/60 hover:text-ink"}`}
              >
                {m === "register" ? "Rejestracja" : "Logowanie"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            {mode === "register" && (
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ink/70 mb-1.5">Imię i nazwisko</label>
                <input required data-testid="auth-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jan Kowalski" className="w-full bg-white border border-ink/20 rounded px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors" />
              </div>
            )}
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink/70 mb-1.5">Adres e-mail</label>
              <input required type="email" data-testid="auth-email-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jan@domena.pl" className="w-full bg-white border border-ink/20 rounded px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ink/70 mb-1.5">Hasło</label>
              <input required type="password" minLength={6} data-testid="auth-password-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min. 6 znaków" className="w-full bg-white border border-ink/20 rounded px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors" />
              
              {/* Tutaj dodany link do resetowania hasła - widoczny tylko w trybie logowania */}
              {mode === "login" && (
                <div className="mt-1.5 text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-xs font-semibold text-ink/60 hover:text-accent transition-colors"
                  >
                    Zapomniałeś hasła?
                  </Link>
                </div>
              )}
            </div>

            {error && <div className="text-sm text-accent font-medium bg-accent/10 border border-accent/30 rounded px-4 py-2.5" data-testid="auth-error">{error}</div>}
            
            <button type="submit" disabled={busy} data-testid="auth-submit-button" className="w-full bg-accent text-white font-display uppercase tracking-wider text-base py-4 rounded hover:bg-accent-dark transition-colors disabled:opacity-50">
              {busy ? "Chwileczkę..." : mode === "register" ? "Utwórz konto i otwórz panel" : "Zaloguj się"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}