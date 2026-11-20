import axios from "axios";
import { toast } from "sonner";
import { formatApiError } from "@/context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export async function downloadPdf(endpoint, payload, filename) {
  try {
    const res = await axios.post(`${API}${endpoint}`, payload, {
      withCredentials: true,
      responseType: "blob",
      timeout: 120000,
    });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success("Dokument PDF został wygenerowany i pobrany.");
  } catch (e) {
    let msg = "Nie udało się wygenerować PDF.";
    if (e.response?.data instanceof Blob) {
      try {
        const text = await e.response.data.text();
        const parsed = JSON.parse(text);
        msg = formatApiError(parsed.detail, msg);
      } catch { /* keep default */ }
    }
    toast.error(msg);
    throw e;
  }
}
