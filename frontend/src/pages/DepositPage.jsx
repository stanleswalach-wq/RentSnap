import { useState } from "react";
import { HandCoins } from "lucide-react";
import { Field, TextInput, SectionTitle } from "@/components/FormBits";
import SignatureField from "@/components/SignatureField";
import { downloadPdf } from "@/lib/pdf";

export default function DepositPage() {
  const [f, setF] = useState({ city: "", date: "", address: "", landlord_name: "", tenant_name: "", amount: "", method: "Przelew bankowy" });
  const [sig, setSig] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const generate = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await downloadPdf("/documents/deposit", { ...f, signature: sig }, "potwierdzenie-kaucji.pdf");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={generate} data-testid="deposit-page">
      <SectionTitle>Potwierdzenie Wpłaty Kaucji</SectionTitle>
      <p className="text-sm text-ink/60 mb-8">Pokwitowanie wpłaty zabezpieczenia — gotowy PDF do podpisu.</p>

      <div className="bg-white border border-ink/10 rounded p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Miejscowość"><TextInput required testid="deposit-city" value={f.city} onChange={set("city")} placeholder="Warszawa" /></Field>
          <Field label="Data"><TextInput required testid="deposit-date" value={f.date} onChange={set("date")} placeholder="01.03.2026" /></Field>
        </div>
        <Field label="Adres lokalu"><TextInput required testid="deposit-address" value={f.address} onChange={set("address")} /></Field>
        <Field label="Wynajmujący (odbierający)"><TextInput required testid="deposit-landlord" value={f.landlord_name} onChange={set("landlord_name")} /></Field>
        <Field label="Najemca (wpłacający)"><TextInput required testid="deposit-tenant" value={f.tenant_name} onChange={set("tenant_name")} /></Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Kwota kaucji (PLN)"><TextInput required testid="deposit-amount" value={f.amount} onChange={set("amount")} placeholder="5000" /></Field>
          <Field label="Forma płatności">
            <select data-testid="deposit-method" value={f.method} onChange={set("method")} className="w-full bg-white border border-ink/20 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-accent transition-colors">
              <option>Przelew bankowy</option>
              <option>Gotówka</option>
              <option>BLIK</option>
            </select>
          </Field>
        </div>
        <SignatureField label="Podpis przyjmującego kaucję" testid="deposit-signature" onChange={setSig} />
      </div>

      <button type="submit" disabled={busy} data-testid="deposit-generate-button" className="mt-8 inline-flex items-center gap-2 bg-accent text-white font-display uppercase tracking-wider text-base px-8 py-4 rounded hover:bg-accent-dark transition-colors disabled:opacity-50">
        <HandCoins size={18} /> {busy ? "Generowanie..." : "Generuj Potwierdzenie PDF"}
      </button>
    </form>
  );
}
