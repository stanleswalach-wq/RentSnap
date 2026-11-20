import { useState, useRef } from "react";
import { Zap } from "lucide-react";
import { Field, TextInput, SectionTitle } from "@/components/FormBits";
import { downloadPdf } from "@/lib/pdf";
import SignatureCanvas from "react-signature-canvas";

const num = (v) => {
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const MeterRow = ({ label, startKey, endKey, rateKey, unit, cost, f, set }) => (
  <div>
    <div className="text-sm font-semibold text-accent mb-2">{label}</div>
    <div className="grid grid-cols-3 gap-3">
      <Field label="Stan początkowy"><TextInput testid={`util-${startKey}`} value={f[startKey]} onChange={set(startKey)} inputMode="decimal" /></Field>
      <Field label="Stan końcowy"><TextInput testid={`util-${endKey}`} value={f[endKey]} onChange={set(endKey)} inputMode="decimal" /></Field>
      <Field label={`Cena / ${unit}`}><TextInput testid={`util-${rateKey}`} value={f[rateKey]} onChange={set(rateKey)} inputMode="decimal" /></Field>
    </div>
    <div className="text-xs text-ink/60 font-mono-num mt-1.5" data-testid={`util-cost-${startKey}`}>Koszt: {cost.toFixed(2)} PLN</div>
  </div>
);

export default function UtilitiesPage() {
  const [f, setF] = useState({
    city: "", date: "", address: "", tenant_name: "",
    elec_start: "", elec_end: "", elec_rate: "1.20",
    water_start: "", water_end: "", water_rate: "15.50",
    gas_start: "", gas_end: "", gas_rate: "3.50",
  });
  const [busy, setBusy] = useState(false);

  // Referencje do pól płótna podpisów
  const landlordPadRef = useRef(null);
  const tenantPadRef = useRef(null);

  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  const elecCost = Math.max(0, num(f.elec_end) - num(f.elec_start)) * num(f.elec_rate);
  const waterCost = Math.max(0, num(f.water_end) - num(f.water_start)) * num(f.water_rate);
  const gasCost = Math.max(0, num(f.gas_end) - num(f.gas_start)) * num(f.gas_rate);
  const total = elecCost + waterCost + gasCost;

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // Pobieramy narysowany podpis jako Base64 (png) z komponentu SignatureCanvas
      const landlordSig = landlordPadRef.current && !landlordPadRef.current.isEmpty() 
        ? landlordPadRef.current.toDataURL() 
        : "";
      
      const tenantSig = tenantPadRef.current && !tenantPadRef.current.isEmpty() 
        ? tenantPadRef.current.toDataURL() 
        : "";

      const payload = {
        ...f,
        landlord_signature: landlordSig,
        tenant_signature: tenantSig,
      };

      await downloadPdf("/documents/utilities", payload, "rozliczenie-mediow.pdf");
    } finally {
      setBusy(false);
    }
  };

  const clearSignatures = () => {
    if (landlordPadRef.current) landlordPadRef.current.clear();
    if (tenantPadRef.current) tenantPadRef.current.clear();
  };

  return (
    <form onSubmit={generate} data-testid="utilities-page">
      <SectionTitle>Kalkulator Rozliczenia Mediów</SectionTitle>
      <p className="text-sm text-ink/60 mb-8">Prąd, woda i gaz — pełne rozliczenie z eksportem do PDF.</p>

      <div className="bg-white border border-ink/10 rounded p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Miejscowość"><TextInput testid="util-city" value={f.city} onChange={set("city")} /></Field>
          <Field label="Data"><TextInput testid="util-date" value={f.date} onChange={set("date")} placeholder="01.03.2026" /></Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Adres lokalu"><TextInput testid="util-address" value={f.address} onChange={set("address")} /></Field>
          <Field label="Najemca"><TextInput testid="util-tenant" value={f.tenant_name} onChange={set("tenant_name")} /></Field>
        </div>

        <MeterRow label="Zużycie prądu" startKey="elec_start" endKey="elec_end" rateKey="elec_rate" unit="kWh" cost={elecCost} f={f} set={set} />
        <MeterRow label="Zużycie wody" startKey="water_start" endKey="water_end" rateKey="water_rate" unit="m³" cost={waterCost} f={f} set={set} />
        <MeterRow label="Zużycie gazu" startKey="gas_start" endKey="gas_end" rateKey="gas_rate" unit="m³" cost={gasCost} f={f} set={set} />

        <div className="bg-cream border border-ink/10 rounded p-5 text-center" data-testid="util-total">
          <span className="text-xs uppercase tracking-widest font-bold text-ink/60 block mb-1">Suma do zapłaty (prąd + woda + gaz)</span>
          <span className="font-display text-3xl font-mono-num">{total.toFixed(2)} PLN</span>
        </div>

        {/* Sekcja odręcznych podpisów */}
        <div className="border-t border-ink/10 pt-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-accent uppercase tracking-wider">Odręczne podpisy stron</h3>
            <button type="button" onClick={clearSignatures} className="text-xs text-red-600 hover:underline">
              Wyczyść podpisy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-2">Podpis Wynajmującego</label>
              <div className="border border-ink/20 rounded bg-gray-50 h-36">
                <SignatureCanvas
                  ref={landlordPadRef}
                  canvasProps={{ className: "w-full h-full cursor-crosshair rounded" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink/70 mb-2">Podpis Najemcy</label>
              <div className="border border-ink/20 rounded bg-gray-50 h-36">
                <SignatureCanvas
                  ref={tenantPadRef}
                  canvasProps={{ className: "w-full h-full cursor-crosshair rounded" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button type="submit" disabled={busy} data-testid="util-generate-button" className="mt-8 inline-flex items-center gap-2 bg-accent text-white font-display uppercase tracking-wider text-base px-8 py-4 rounded hover:bg-accent-dark transition-colors disabled:opacity-50">
        <Zap size={18} /> {busy ? "Generowanie..." : "Generuj Rozliczenie PDF"}
      </button>
    </form>
  );
}