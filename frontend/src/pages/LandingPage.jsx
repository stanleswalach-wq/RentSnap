import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { useAuth, formatApiError } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const IMG_LANDLORD = "https://images.unsplash.com/photo-1609921141835-710b7fa6e438?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzR8MHwxfHNlYXJjaHwyfHxzbWFydHBob25lJTIwZGFzaGJvYXJkJTIwYXBwJTIwbWluaW1hbHxlbnwwfHx8fDE3OTM5OTI1MTV8MA&ixlib=rb-4.1.0&q=85";
const IMG_INVESTOR = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBkYXNoYm9hcmQlMjBhcHAlMjBtaW5pbWFsfGVufDB8fHx8MTc5Mzk5MjUxNXww&ixlib=rb-4.1.0&q=85";
const IMG_AGENCY = "https://images.unsplash.com/photo-1681949103006-70066fb25dfe?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwyfHxyZWFsJTIwZXN0YXRlJTIwb2ZmaWNlJTIwdGVhbXdvcmt8ZW58MHx8fHwxNzkzOTkyNTE1fDA&ixlib=rb-4.1.0&q=85";

const MQ_ITEMS = [
  "UMOWA NAJMU OKAZJONALNEGO", "PROTOKÓŁ ZDAWCZO-ODBIORCZY", "POTWIERDZENIE KAUCJI",
  "ROZLICZENIE MEDIÓW", "DLA WŁAŚCICIELI I AGENCJI", "BŁYSKAWICZNY EKSPORT PDF",
];

export default function LandingPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", user_type: "Właściciel mieszkań (wynajem prywatny)" });
  const [sending, setSending] = useState(false);

  const submitLead = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await axios.post(`${API}/leads`, form);
      toast.success("Dziękujemy! Zgłoszenie przyjęte — odezwiemy się z dostępem do aplikacji.");
      setForm({ name: "", email: "", user_type: "Właściciel mieszkań (wynajem prywatny)" });
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  const inputDark =
    "w-full bg-ink border border-ground/20 rounded px-4 py-3 text-sm text-ground focus:outline-none focus:border-accent placeholder:text-ground/40 transition-colors";

  return (
    <div className="bg-ground text-ink antialiased" data-testid="landing-page">
      {/* HEADER */}
      <header className="border-b border-ink/10 bg-ground sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" data-testid="brand-logo">
            <svg className="w-7 h-7 text-ink" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="2" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" />
              <path d="M7 9h14M7 14h9M7 19h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-display text-2xl tracking-tight uppercase">LOKUM.PDF</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#funkcje" className="hidden md:inline-block text-xs uppercase tracking-[.14em] font-semibold hover:opacity-60 transition-opacity">Funkcje</a>
            <a href="#cennik" className="hidden md:inline-block text-xs uppercase tracking-[.14em] font-semibold hover:opacity-60 transition-opacity">Cennik</a>
            {user ? (
              <Link to="/panel" data-testid="nav-dashboard-link" className="bg-ink text-ground text-xs uppercase tracking-[.14em] font-bold px-5 py-3 rounded hover:bg-coal transition-colors">
                Otwórz panel
              </Link>
            ) : (
              <Link to="/logowanie" data-testid="nav-login-link" className="bg-ink text-ground text-xs uppercase tracking-[.14em] font-bold px-5 py-3 rounded hover:bg-coal transition-colors">
                Rozpocznij teraz
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="py-24 md:py-32 border-b border-ink/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <span className="text-xs uppercase tracking-[.18em] font-bold text-accent block mb-4">Cała Polska · Platforma SaaS dla wynajmu</span>
              <h1 className="font-display uppercase text-5xl md:text-7xl lg:text-[80px] leading-[0.92] tracking-tight">
                <span className="ln"><span>Najem bez chaosu</span></span>
                <span className="ln"><span>i bez prawnika.</span></span>
              </h1>
              <p className="mt-8 text-lg md:text-xl text-ink/80 max-w-xl leading-relaxed d1-fade">
                Wszystkie dokumenty najmu i protokoły wygenerowane jako gotowy PDF w kilka minut.
              </p>
              <div className="mt-10 flex flex-wrap gap-4 items-center d1-fade">
                <Link to="/logowanie" data-testid="hero-cta" className="bg-accent text-white text-xs uppercase tracking-[.16em] font-bold px-8 py-4 rounded hover:bg-accent-dark transition-colors">
                  Wygeneruj umowę w 3 min
                </Link>
                <a href="#funkcje" data-testid="hero-secondary-cta" className="border border-ink/30 text-ink text-xs uppercase tracking-[.16em] font-bold px-7 py-4 rounded hover:border-ink transition-colors">
                  Zobacz funkcje
                </a>
              </div>
            </div>
            <div className="lg:col-span-4 bg-cream p-8 rounded border border-ink/10 d1-card">
              <div className="font-mono-num text-xs uppercase tracking-widest text-ink/60 mb-2">Generowanie dokumentu</div>
              <div className="font-display uppercase text-4xl mb-4">3 MINUTY</div>
              <p className="text-xs text-ink/70 leading-relaxed mb-6">Wypełniasz intuicyjny formularz, system automatycznie sporządza komplet dokumentów.</p>
              <div className="space-y-2 font-mono-num text-xs text-ink/80 border-t border-ink/10 pt-4">
                <div className="flex justify-between"><span>Umowa najmu:</span><strong className="text-accent">Gotowa (PDF)</strong></div>
                <div className="flex justify-between"><span>Protokół zdawczy:</span><strong className="text-accent">Gotowy (PDF)</strong></div>
                <div className="flex justify-between"><span>Kaucja + media:</span><strong className="text-accent">Gotowe (PDF)</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="overflow-hidden bg-ink text-ground py-4 border-y border-ink">
        <div className="d1-mq text-xs uppercase tracking-[.25em] font-bold">
          {[...MQ_ITEMS, ...MQ_ITEMS].map((item, i) => (
            <span key={i} className="mx-6">• {item}</span>
          ))}
        </div>
      </div>

      {/* FEATURES / AUDIENCES */}
      <section id="funkcje" className="py-24 md:py-32">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-xs uppercase tracking-[.18em] font-bold text-accent block mb-3">Dla kogo tworzymy</span>
            <h2 className="font-display uppercase text-4xl md:text-5xl max-w-2xl">Prostota dla właścicieli, skala dla agencji nieruchomości.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Właściciele mieszkań", desc: "Wynajmujesz 1 lub 2 lokale? Przygotuj umowę, protokół i potwierdzenie kaucji w telefonie i miej spokój na lata.", img: IMG_LANDLORD, cap: "Panel wynajmującego", testid: "feature-landlord" },
              { title: "Inwestorzy Premium", desc: "Zarządzaj teczką lokali i generuj standaryzowane protokoły ze zdjęciami liczników i podpisami cyfrowymi.", img: IMG_INVESTOR, cap: "Moduł inwestora", testid: "feature-investor" },
              { title: "Agencje i Pośrednicy", desc: "Komplet dokumentów — umowa z klauzulami, protokół, rozliczenie mediów — podpisany od ręki u klienta.", img: IMG_AGENCY, cap: "Tryb biura nieruchomości", testid: "feature-agency" },
            ].map((f) => (
              <div key={f.title} data-testid={f.testid} className="p-8 bg-cream rounded border border-ink/10 flex flex-col justify-between hover:border-ink/30 transition-colors">
                <div>
                  <h3 className="font-display uppercase text-2xl mb-3">{f.title}</h3>
                  <p className="text-sm text-ink/75 leading-relaxed">{f.desc}</p>
                </div>
                <figure className="mt-8 aspect-[16/9] rounded overflow-hidden border border-ink/10 relative">
                  <img src={f.img} alt={f.cap} className="w-full h-full object-cover" loading="lazy" />
                  <figcaption className="absolute bottom-0 left-0 right-0 bg-ground/90 backdrop-blur text-[10px] uppercase tracking-wider text-ink/70 font-mono-num px-3 py-2">{f.cap}</figcaption>
                </figure>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="cennik" className="py-24 md:py-32 bg-cream border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-[.18em] font-bold text-accent block mb-3">Subskrypcja SaaS</span>
            <h2 className="font-display uppercase text-4xl md:text-5xl">Wybierz plan dla siebie</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="p-8 bg-ground rounded border border-ink/15 flex flex-col justify-between" data-testid="plan-starter">
              <div>
                <span className="text-xs uppercase tracking-widest font-bold text-ink/60">Właściciel</span>
                <div className="font-display text-4xl mt-3 mb-1 font-mono-num">49 PLN <span className="text-base font-normal">/miesiąc</span></div>
                <p className="text-xs text-ink/70 mb-6">Dla osób prywatnych wynajmujących do 3 mieszkań.</p>
                <ul className="space-y-3 text-sm text-ink/85 border-t border-ink/10 pt-6">
                  <li>✓ Nielimitowane umowy najmu PDF</li>
                  <li>✓ Protokoły zdawczo-odbiorcze ze zdjęciami</li>
                  <li>✓ Potwierdzenia kaucji i rozliczenia mediów</li>
                </ul>
              </div>
              <Link to="/logowanie" data-testid="plan-starter-cta" className="mt-8 block text-center border border-ink text-ink text-xs uppercase tracking-[.14em] font-bold py-3.5 rounded hover:bg-ink hover:text-ground transition-colors">Wybierz plan</Link>
            </div>
            <div className="p-8 bg-ink text-ground rounded border border-ink flex flex-col justify-between shadow-xl" data-testid="plan-pro">
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest font-bold text-accent">Agencja &amp; Pro</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-accent text-white px-2.5 py-1 rounded">Popularny</span>
                </div>
                <div className="font-display text-4xl mt-3 mb-1 font-mono-num">199 PLN <span className="text-base font-normal text-ground/70">/miesiąc</span></div>
                <p className="text-xs text-ground/70 mb-6">Dla biur nieruchomości i inwestorów z dużym portfelem.</p>
                <ul className="space-y-3 text-sm text-ground/85 border-t border-ground/15 pt-6">
                  <li>✓ Nielimitowani agenci i lokale</li>
                  <li>✓ Własne logo na dokumentach PDF</li>
                  <li>✓ Priorytetowe wsparcie i masowy eksport</li>
                </ul>
              </div>
              <Link to="/logowanie" data-testid="plan-pro-cta" className="mt-8 block text-center bg-accent text-white text-xs uppercase tracking-[.14em] font-bold py-3.5 rounded hover:bg-accent-dark transition-colors">Rozpocznij test pro</Link>
            </div>
          </div>
        </div>
      </section>

      {/* HONEST PROOF PLACEHOLDER */}
      <section className="py-20 border-t border-ink/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="p-8 rounded border border-dashed border-ink/25 text-center bg-cream/50" data-testid="proof-placeholder">
            <span className="text-xs uppercase tracking-[.18em] font-bold text-ink/60 block mb-2">Opinie pierwszych użytkowników</span>
            <p className="text-sm text-ink/70 font-medium">Opinie z wdrożeń pilotażowych w polskich agencjach pojawią się tutaj po zakończeniu fazy beta.</p>
          </div>
        </div>
      </section>

      {/* CONTACT / LEAD FORM */}
      <section id="kontakt" className="py-24 md:py-32 bg-ink text-ground">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs uppercase tracking-[.18em] font-bold text-accent block mb-3">Zacznij zarabiać na najmie</span>
            <h2 className="font-display uppercase text-4xl md:text-5xl">Dołącz do wczesnego dostępu</h2>
            <p className="mt-4 text-sm text-ground/70 max-w-lg mx-auto">Wypełnij krótki formularz · otrzymasz dostęp do wersji testowej oraz zniżkę na start.</p>
          </div>
          <form onSubmit={submitLead} data-testid="lead-form" className="bg-coal p-8 md:p-10 rounded-lg border border-ground/10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ground/80 mb-2">Imię i nazwisko</label>
                <input required data-testid="lead-name-input" type="text" placeholder="Jan Kowalski" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputDark} />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-ground/80 mb-2">Adres e-mail</label>
                <input required data-testid="lead-email-input" type="email" placeholder="jan@domena.pl" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputDark} />
              </div>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-ground/80 mb-2">Kim jesteś?</label>
              <select data-testid="lead-type-select" value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })} className={inputDark}>
                <option>Właściciel mieszkań (wynajem prywatny)</option>
                <option>Inwestor (pakiet kilku lokali)</option>
                <option>Biuro / Agencja nieruchomości</option>
              </select>
            </div>
            <button type="submit" disabled={sending} data-testid="lead-submit-button" className="w-full bg-accent text-white font-display uppercase tracking-wider text-base py-4 rounded hover:bg-accent-dark transition-colors disabled:opacity-50">
              {sending ? "Wysyłanie..." : "Uzyskaj dostęp do aplikacji"}
            </button>
          </form>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 bg-night text-ground/60 border-t border-ground/10 text-xs">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-display uppercase text-sm text-ground">LOKUM.PDF · SAAS DLA NAJMU W POLSCE</div>
          <div>Wszystkie prawa zastrzeżone. Proste generowanie umów i protokołów PDF.</div>
        </div>
      </footer>
    </div>
  );
}
