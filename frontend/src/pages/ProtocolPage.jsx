import { useState } from "react";
import { ClipboardCheck, ImagePlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Field, TextInput, SectionTitle, PresetChips } from "@/components/FormBits";
import SignatureField from "@/components/SignatureField";
import { downloadPdf } from "@/lib/pdf";

const ID_PRESETS = [
  { label: "PESEL", value: "PESEL: " },
  { label: "NIP", value: "NIP: " },
  { label: "Dowód osobisty", value: "Dowód osobisty: " },
];
const CONDITION_PRESETS = [
  { label: "Stan dobry", value: "Stan dobry, brak zarysowań i usterek." },
  { label: "Ślady użytkowania", value: "Widoczne drobne ślady użytkowania." },
  { label: "Do naprawy/czyszczenia", value: "Wymaga czyszczenia lub drobnej naprawy." },
];

const STEPS = ["Dane formalne i strony", "Liczniki i stan techniczny", "Wyposażenie i klucze", "Zdjęcia i podpisy"];

const initialForm = {
  city: "", date: "", contract_ref: "", address: "", area: "", rooms: "",
  landlord_name: "", landlord_id: "", tenant_name: "", tenant_id: "",
  elec_num: "", elec_val: "", water_cold_num: "", water_cold_val: "",
  water_hot_num: "", water_hot_val: "", gas_num: "", gas_val: "", heating_val: "",
  walls: "", floors: "", doors_windows: "", installations: "", defects: "",
  furniture: "", appliances: "", keys_count: "", remotes_count: "", access_codes: "",
};

export default function ProtocolPage() {
  const [step, setStep] = useState(0);
  const [f, setF] = useState(initialForm);
  const [photos, setPhotos] = useState([]);
  const [landlordSig, setLandlordSig] = useState(null);
  const [tenantSig, setTenantSig] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const addPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos((p) => [...p, reader.result]);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const generate = async () => {
    setBusy(true);
    try {
      await downloadPdf("/documents/protocol", {
        ...f, photos,
        landlord_signature: landlordSig, tenant_signature: tenantSig,
      }, "protokol-zdawczo-odbiorczy.pdf");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="protocol-page">
      <SectionTitle>Kreator Protokołu Zdawczo-Odbiorczego</SectionTitle>
      <p className="text-sm text-ink/60 mb-8">Liczniki, stan techniczny, wyposażenie, zdjęcia i podpisy — w 4 krokach.</p>

      <div className="flex gap-2 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(i)}
            data-testid={`protocol-step-tab-${i}`}
            className={`text-[11px] uppercase tracking-wider font-bold px-4 py-2.5 rounded whitespace-nowrap transition-colors ${
              step === i ? "bg-ink text-ground" : i < step ? "bg-cream text-ink border border-ink/20" : "bg-cream/60 text-ink/50 border border-ink/10"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-ink/10 rounded p-6 space-y-5">
        {step === 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Miejscowość"><TextInput testid="proto-city" value={f.city} onChange={set("city")} placeholder="Warszawa" /></Field>
              <Field label="Data"><TextInput testid="proto-date" value={f.date} onChange={set("date")} placeholder="01.03.2026" /></Field>
            </div>
            <Field label="Podstawa przekazania"><TextInput testid="proto-contract" value={f.contract_ref} onChange={set("contract_ref")} placeholder="np. Umowa najmu z dnia 01.03.2026" /></Field>
            <Field label="Adres lokalu"><TextInput testid="proto-address" value={f.address} onChange={set("address")} /></Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Metraż (m²)"><TextInput testid="proto-area" value={f.area} onChange={set("area")} /></Field>
              <Field label="Liczba pokoi"><TextInput testid="proto-rooms" value={f.rooms} onChange={set("rooms")} /></Field>
            </div>
            <h4 className="font-display uppercase text-base pt-2">Przekazujący (Wynajmujący)</h4>
            <Field label="Nazwa firmy / dane osoby"><TextInput testid="proto-landlord-name" value={f.landlord_name} onChange={set("landlord_name")} /></Field>
            <Field label="Identyfikator przekazującego">
              <TextInput testid="proto-landlord-id" value={f.landlord_id} onChange={set("landlord_id")} />
              <PresetChips options={ID_PRESETS} onPick={(v) => setF({ ...f, landlord_id: v })} />
            </Field>
            <h4 className="font-display uppercase text-base pt-2">Przejmujący (Najemca)</h4>
            <Field label="Nazwa firmy / dane osoby"><TextInput testid="proto-tenant-name" value={f.tenant_name} onChange={set("tenant_name")} /></Field>
            <Field label="Identyfikator przejmującego">
              <TextInput testid="proto-tenant-id" value={f.tenant_id} onChange={set("tenant_id")} />
              <PresetChips options={ID_PRESETS} onPick={(v) => setF({ ...f, tenant_id: v })} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <h4 className="font-display uppercase text-base">Stany liczników mediów</h4>
            {[
              ["Energia elektryczna (kWh)", "elec_num", "elec_val"],
              ["Woda zimna (m³)", "water_cold_num", "water_cold_val"],
              ["Woda ciepła (m³)", "water_hot_num", "water_hot_val"],
              ["Gaz (m³)", "gas_num", "gas_val"],
            ].map(([label, numKey, valKey]) => (
              <div key={numKey} className="grid grid-cols-2 gap-4">
                <Field label={`${label} — Nr licznika`}><TextInput testid={`proto-${numKey}`} value={f[numKey]} onChange={set(numKey)} /></Field>
                <Field label={`${label} — Odczyt`}><TextInput testid={`proto-${valKey}`} value={f[valKey]} onChange={set(valKey)} /></Field>
              </div>
            ))}
            <Field label="Ogrzewanie (stan / podzielniki)"><TextInput testid="proto-heating" value={f.heating_val} onChange={set("heating_val")} /></Field>

            <h4 className="font-display uppercase text-base pt-2">Stan techniczny lokalu</h4>
            {[["Ściany i sufity", "walls"], ["Podłogi", "floors"], ["Okna i drzwi", "doors_windows"], ["Instalacje", "installations"]].map(([label, key]) => (
              <Field key={key} label={label}>
                <TextInput testid={`proto-${key}`} value={f[key]} onChange={set(key)} />
                <PresetChips options={CONDITION_PRESETS} onPick={(v) => setF({ ...f, [key]: v })} />
              </Field>
            ))}
            <Field label="Wykaz usterek / zniszczeń">
              <textarea data-testid="proto-defects" value={f.defects} onChange={set("defects")} rows={2} className="w-full bg-white border border-ink/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Lista mebli i stan">
              <textarea data-testid="proto-furniture" value={f.furniture} onChange={set("furniture")} rows={2} className="w-full bg-white border border-ink/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" placeholder="np. Sofa 3-os., stół + 4 krzesła, szafa — stan dobry" />
            </Field>
            <Field label="Sprzęt AGD/RTV (marki, stan)">
              <textarea data-testid="proto-appliances" value={f.appliances} onChange={set("appliances")} rows={2} className="w-full bg-white border border-ink/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors" placeholder="np. Lodówka Samsung, pralka Bosch, TV LG 43&quot;" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Komplety kluczy"><TextInput testid="proto-keys" value={f.keys_count} onChange={set("keys_count")} /></Field>
              <Field label="Liczba pilotów"><TextInput testid="proto-remotes" value={f.remotes_count} onChange={set("remotes_count")} /></Field>
            </div>
            <Field label="Kody dostępu"><TextInput testid="proto-access-codes" value={f.access_codes} onChange={set("access_codes")} /></Field>
          </>
        )}

        {step === 3 && (
          <>
            <h4 className="font-display uppercase text-base">Dokumentacja fotograficzna</h4>
            <label data-testid="proto-add-photo" className="inline-flex items-center gap-2 border border-ink/30 text-ink text-xs uppercase tracking-wider font-bold px-5 py-3 rounded cursor-pointer hover:border-accent hover:text-accent transition-colors">
              <ImagePlus size={15} /> Dodaj zdjęcie ({photos.length})
              <input type="file" accept="image/*" className="hidden" onChange={addPhoto} />
            </label>
            {photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto py-2" data-testid="proto-photos">
                {photos.map((src, i) => (
                  <div key={i} className="relative shrink-0">
                    <img src={src} alt={`Zdjęcie ${i + 1}`} className="w-24 h-24 object-cover rounded border border-ink/15" />
                    <button type="button" onClick={() => setPhotos(photos.filter((_, j) => j !== i))} data-testid={`proto-photo-remove-${i}`} className="absolute -top-2 -right-2 bg-accent text-white rounded-full p-1 hover:bg-accent-dark transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <h4 className="font-display uppercase text-base pt-2">Podpisy stron</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SignatureField label="Podpis przekazującego" testid="proto-landlord-signature" onChange={setLandlordSig} />
              <SignatureField label="Podpis przejmującego" testid="proto-tenant-signature" onChange={setTenantSig} />
            </div>
          </>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <button type="button" onClick={() => setStep(step - 1)} data-testid="proto-back-button" className="inline-flex items-center gap-2 border border-ink/30 text-ink text-xs uppercase tracking-wider font-bold px-6 py-3.5 rounded hover:border-ink transition-colors">
            <ChevronLeft size={15} /> Wstecz
          </button>
        )}
        {step < 3 ? (
          <button type="button" onClick={() => setStep(step + 1)} data-testid="proto-next-button" className="inline-flex items-center gap-2 bg-ink text-ground text-xs uppercase tracking-wider font-bold px-6 py-3.5 rounded hover:bg-coal transition-colors">
            Dalej <ChevronRight size={15} />
          </button>
        ) : (
          <button type="button" onClick={generate} disabled={busy} data-testid="proto-generate-button" className="inline-flex items-center gap-2 bg-accent text-white font-display uppercase tracking-wider text-base px-8 py-4 rounded hover:bg-accent-dark transition-colors disabled:opacity-50">
            <ClipboardCheck size={18} /> {busy ? "Generowanie..." : "Generuj Protokół PDF"}
          </button>
        )}
      </div>
    </div>
  );
}
