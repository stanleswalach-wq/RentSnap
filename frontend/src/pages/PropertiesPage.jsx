import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Field, TextInput, SectionTitle } from "@/components/FormBits";
import { formatApiError } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({ address: "", tenant: "", rent: "" });
  const [loading, setLoading] = useState(true);

  const load = () =>
    axios.get(`${API}/properties`, { withCredentials: true })
      .then((res) => {
        // Zabezpieczenie: upewniamy się, że to co przyszło z backendu to tablica
        setProperties(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        toast.error("Nie udało się wczytać lokali");
        setProperties([]); // W razie błędu ustawiamy pustą tablicę, żeby uniknąć crasha
      })
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const addProperty = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/properties`, form, { withCredentials: true });
      toast.success("Lokal dodany do teczki.");
      setForm({ address: "", tenant: "", rent: "" });
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const removeProperty = async (id) => {
    try {
      await axios.delete(`${API}/properties/${id}`, { withCredentials: true });
      toast.success("Lokal usunięty.");
      setProperties((p) => (Array.isArray(p) ? p.filter((x) => x.id !== id) : []));
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  // Dodatkowe zabezpieczenie przed mapowaniem na czymś, co nie jest tablicą
  const safeProperties = Array.isArray(properties) ? properties : [];

  return (
    <div data-testid="properties-page">
      <SectionTitle>Wirtualna Teczka Nieruchomości</SectionTitle>
      <p className="text-sm text-ink/60 mb-8">Zarządzaj swoimi lokalami i najemcami w jednym miejscu.</p>

      <form onSubmit={addProperty} data-testid="property-form" className="bg-white border border-ink/10 rounded p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Adres lokalu" testid="prop-address"><TextInput required testid="prop-address-input" placeholder="np. Warszawa, Mokotów 12/4" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Najemca" testid="prop-tenant"><TextInput testid="prop-tenant-input" placeholder="Imię i nazwisko" value={form.tenant} onChange={(e) => setForm({ ...form, tenant: e.target.value })} /></Field>
          <Field label="Czynsz (PLN)" testid="prop-rent"><TextInput testid="prop-rent-input" placeholder="2500" value={form.rent} onChange={(e) => setForm({ ...form, rent: e.target.value })} /></Field>
        </div>
        <button type="submit" data-testid="prop-add-button" className="mt-5 inline-flex items-center gap-2 bg-ink text-ground text-xs uppercase tracking-wider font-bold px-6 py-3 rounded hover:bg-coal transition-colors">
          <Plus size={15} /> Dodaj lokal
        </button>
      </form>

      {loading ? (
        <div className="text-sm text-ink/50">Wczytywanie...</div>
      ) : safeProperties.length === 0 ? (
        <div className="border border-dashed border-ink/25 rounded p-10 text-center text-sm text-ink/60" data-testid="properties-empty">
          Brak zapisanych lokali. Dodaj pierwszy lokal powyżej.
        </div>
      ) : (
        <div className="space-y-3" data-testid="properties-list">
          {safeProperties.map((p) => (
            <div key={p.id} data-testid={`property-card-${p.id}`} className="bg-white border border-ink/10 rounded p-5 flex items-center gap-4 hover:border-ink/30 transition-colors">
              <div className="w-11 h-11 rounded bg-cream flex items-center justify-center shrink-0">
                <Building2 size={20} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{p.address}</div>
                <div className="text-xs text-ink/60 mt-0.5 font-mono-num">Najemca: {p.tenant} · Czynsz: {p.rent} PLN</div>
              </div>
              <button onClick={() => removeProperty(p.id)} data-testid={`property-delete-${p.id}`} className="text-ink/40 hover:text-accent transition-colors p-2" aria-label="Usuń lokal">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}