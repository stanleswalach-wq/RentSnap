import React, { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { Field, TextInput, SectionTitle, PresetChips } from "@/components/FormBits";
import SignatureField from "@/components/SignatureField";
import { downloadPdf } from "@/lib/pdf";

const ID_PRESETS = [
  { label: "PESEL", value: "PESEL: " },
  { label: "NIP", value: "NIP: " },
  { label: "Dowód osobisty", value: "Dowód osobisty: " },
];

const DEFAULT_CLAUSES = [
  { key: "no_smoking", label: "Zakaz palenia (wyroby tytoniowe, e-papierosy)" },
  { key: "no_sublet", label: "Zakaz podnajmu bez zgody właściciela" },
  { key: "no_business", label: "Zakaz prowadzenia działalności gospodarczej w lokalu" },
  { key: "no_pets", label: "Wymagana zgoda na trzymanie zwierząt" },
  { key: "quiet_hours", label: "Obowiązek przestrzegania ciszy nocnej (22:00-6:00)" },
  { key: "report_defects", label: "Obowiązek niezwłocznego zgłaszania awarii i usterek" },
  { key: "inspection_access", label: "Prawo do przeglądu lokalu po uzgodnieniu terminu" },
];

export default function LeasePage() {
  const [occasional, setOccasional] = useState(false);
  const [f, setF] = useState({
    city: "", date: "", address: "", area: "",
    landlord_name: "", landlord_id: "", tenant_name: "", tenant_id: "",
    rent_amount: "", deposit_amount: "", payment_day: "",
    start_date: "", end_date: "", alt_address: "", alt_owner: "",
    smoking_penalty: "1000",
  });

  const [clauses, setClauses] = useState({ 
    no_smoking: true, no_sublet: true, no_business: true, 
    no_pets: false, quiet_hours: true, report_defects: true, inspection_access: true 
  });

  // Własne klauzule zapisywane w pamięci przeglądarki
  const [customClauses, setCustomClauses] = useState(() => {
    try {
      const saved = localStorage.getItem('user_custom_clauses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [newClauseLabel, setNewClauseLabel] = useState('');
  const [landlordSig, setLandlordSig] = useState(null);
  const [tenantSig, setTenantSig] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('user_custom_clauses', JSON.stringify(customClauses));
    } catch (e) {
      console.error(e);
    }
  }, [customClauses]);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  // Dodawanie nowej zasady
  const handleAddCustomClause = (e) => {
    e.preventDefault();
    if (!newClauseLabel.trim()) return;

    const uniqueKey = `custom_${Date.now()}`;
    const newClause = { key: uniqueKey, label: newClauseLabel.trim() };

    setCustomClauses([...customClauses, newClause]);
    setClauses(prev => ({ ...prev, [uniqueKey]: true }));
    setNewClauseLabel('');
  };

  // Usuwanie własnej zasady
  const handleDeleteCustomClause = (keyToDelete) => {
    setCustomClauses(customClauses.filter(c => c.key !== keyToDelete));
    const updatedClauses = { ...clauses };
    delete updatedClauses[keyToDelete];
    setClauses(updatedClauses);
  };

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      // 1. Przygotowujemy słownik z tekstami własnych klauzul
      const customTexts = customClauses.reduce((acc, item) => {
        acc[item.key] = item.label;
        return acc;
      }, {});

      // 2. Przekazujemy custom_texts do funkcji downloadPdf
      await downloadPdf("/documents/lease", {
        ...f, 
        occasional, 
        clauses,
        custom_texts: customTexts, // <--- TUTAJ JEST KLUCZ!
        landlord_signature: landlordSig, 
        tenant_signature: tenantSig,
      }, "umowa-najmu.pdf");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={generate} data-testid="lease-page">
      <SectionTitle>Umowa Najmu</SectionTitle>
      <p className="text-sm text-ink/60 mb-8">Zwykła lub najem okazjonalny — z klauzulami chroniącymi właściciela.</p>

      <div className="bg-white border border-ink/10 rounded p-6 space-y-5">
        <Field label="Rodzaj umowy najmu">
          <select data-testid="lease-type-select" value={occasional ? "1" : "0"} onChange={(e) => setOccasional(e.target.value === "1")} className="w-full bg-white border border-ink/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-accent">
            <option value="0">Umowa Najmu Zwykła</option>
            <option value="1">Umowa Najmu Okazjonalnego (wymaga notariusza)</option>
          </select>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Miejscowość"><TextInput required testid="lease-city" value={f.city} onChange={set("city")} placeholder="Warszawa" /></Field>
          <Field label="Data sporządzenia"><TextInput required testid="lease-date" value={f.date} onChange={set("date")} placeholder="01.03.2026" /></Field>
        </div>
        <Field label="Adres lokalu"><TextInput required testid="lease-address" value={f.address} onChange={set("address")} placeholder="ul. Przykładowa 12/4, Warszawa" /></Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Metraż (m²)"><TextInput testid="lease-area" value={f.area} onChange={set("area")} placeholder="45" /></Field>
          <Field label="Dzień płatności czynszu"><TextInput testid="lease-payment-day" value={f.payment_day} onChange={set("payment_day")} placeholder="10" /></Field>
        </div>

        <h4 className="font-display uppercase text-base pt-2">Dane Wynajmującego</h4>
        <Field label="Imię i nazwisko / Firma"><TextInput required testid="lease-landlord-name" value={f.landlord_name} onChange={set("landlord_name")} /></Field>
        <Field label="Identyfikator Wynajmującego">
          <TextInput testid="lease-landlord-id" value={f.landlord_id} onChange={set("landlord_id")} />
          <PresetChips options={ID_PRESETS} onPick={(v) => setF({ ...f, landlord_id: v })} />
        </Field>

        <h4 className="font-display uppercase text-base pt-2">Dane Najemcy</h4>
        <Field label="Imię i nazwisko / Firma"><TextInput required testid="lease-tenant-name" value={f.tenant_name} onChange={set("tenant_name")} /></Field>
        <Field label="Identyfikator Najemcy">
          <TextInput testid="lease-tenant-id" value={f.tenant_id} onChange={set("tenant_id")} />
          <PresetChips options={ID_PRESETS} onPick={(v) => setF({ ...f, tenant_id: v })} />
        </Field>

        <h4 className="font-display uppercase text-base pt-2">Warunki finansowe i czas</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Czynsz (PLN)"><TextInput required testid="lease-rent" value={f.rent_amount} onChange={set("rent_amount")} placeholder="2500" /></Field>
          <Field label="Kaucja (PLN)"><TextInput required testid="lease-deposit" value={f.deposit_amount} onChange={set("deposit_amount")} placeholder="5000" /></Field>
          <Field label="Data od"><TextInput required testid="lease-start" value={f.start_date} onChange={set("start_date")} placeholder="01.03.2026" /></Field>
          <Field label="Data do"><TextInput required testid="lease-end" value={f.end_date} onChange={set("end_date")} placeholder="28.02.2027" /></Field>
        </div>

        {occasional && (
          <>
            <h4 className="font-display uppercase text-base pt-2 text-accent">Najem Okazjonalny — lokal zastępczy</h4>
            <Field label="Adres lokalu zastępczego wskazanego przez najemcę"><TextInput testid="lease-alt-address" value={f.alt_address} onChange={set("alt_address")} /></Field>
            <Field label="Imię i nazwisko właściciela lokalu zastępczego"><TextInput testid="lease-alt-owner" value={f.alt_owner} onChange={set("alt_owner")} /></Field>
          </>
        )}

        <h4 className="font-display uppercase text-base pt-2">Zasady użytkowania i klauzule chroniące</h4>
        <div className="space-y-2">
          {DEFAULT_CLAUSES.map((c) => (
            <label key={c.key} className="flex items-start gap-3 text-sm cursor-pointer" data-testid={`clause-${c.key}`}>
              <input type="checkbox" checked={clauses[c.key] ?? false} onChange={(e) => setClauses({ ...clauses, [c.key]: e.target.checked })} className="mt-1 accent-[#b5381f]" />
              <span>{c.label}</span>
            </label>
          ))}

          {/* Własne klauzule z przyciskiem Usuń */}
          {customClauses.map((c) => (
            <div key={c.key} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded border border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer flex-grow">
                <input type="checkbox" checked={clauses[c.key] ?? true} onChange={(e) => setClauses({ ...clauses, [c.key]: e.target.checked })} className="mt-1 accent-[#b5381f]" />
                <span className="text-gray-900 font-medium">{c.label} <span className="text-xs text-gray-500">(Własna)</span></span>
              </label>
              <button type="button" onClick={() => handleDeleteCustomClause(c.key)} className="text-red-600 hover:text-red-800 text-xs px-2 py-1 font-semibold">
                ✕ Usuń
              </button>
            </div>
          ))}
        </div>

        {/* Pole do wpisywania nowej zasady */}
        <div className="pt-2 flex gap-2">
          <input
            type="text"
            value={newClauseLabel}
            onChange={(e) => setNewClauseLabel(e.target.value)}
            placeholder="Dopisz własną zasadę/klauzulę..."
            className="border border-ink/20 px-3 py-2 rounded text-sm flex-grow focus:outline-none focus:border-accent"
          />
          <button type="button" onClick={handleAddCustomClause} className="bg-ink text-white px-4 py-2 rounded text-sm hover:bg-ink/80">
            Dodaj zasadę
          </button>
        </div>

        {clauses.no_smoking && (
          <div className="pl-7 max-w-xs pt-2">
            <Field label="Kara umowna za złamanie zakazu palenia (PLN)"><TextInput testid="lease-smoking-penalty" value={f.smoking_penalty} onChange={set("smoking_penalty")} /></Field>
          </div>
        )}

        <h4 className="font-display uppercase text-base pt-2">Podpisy stron</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SignatureField label="Podpis Wynajmującego" testid="lease-landlord-signature" onChange={setLandlordSig} />
          <SignatureField label="Podpis Najemcy" testid="lease-tenant-signature" onChange={setTenantSig} />
        </div>
      </div>

      <button type="submit" disabled={busy} data-testid="lease-generate-button" className="mt-8 inline-flex items-center gap-2 bg-accent text-white font-display uppercase tracking-wider text-base px-8 py-4 rounded hover:bg-accent-dark disabled:opacity-50">
        <FileText size={18} /> {busy ? "Generowanie..." : "Generuj Umowę PDF"}
      </button>
    </form>
  );
}