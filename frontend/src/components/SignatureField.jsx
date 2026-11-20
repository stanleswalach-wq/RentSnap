import { useRef, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Eraser } from "lucide-react";

export default function SignatureField({ label, testid, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current?.getCanvas();
    if (!canvas) return;
    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const data = ref.current.isEmpty() ? null : ref.current.toDataURL();
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d").scale(ratio, ratio);
      if (data) {
        const img = new Image();
        img.onload = () => canvas.getContext("2d").drawImage(img, 0, 0);
        img.src = data;
      }
    };
    resize();
  }, []);

  return (
    <div data-testid={testid}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs uppercase tracking-wider font-semibold text-ink/70">{label}</span>
        <button
          type="button"
          data-testid={`${testid}-clear`}
          onClick={() => { ref.current?.clear(); onChange(null); }}
          className="inline-flex items-center gap-1 text-xs text-ink/50 hover:text-accent transition-colors"
        >
          <Eraser size={13} /> Wyczyść
        </button>
      </div>
      <div className="border border-ink/20 rounded bg-white h-32 overflow-hidden">
        <SignatureCanvas
          ref={ref}
          penColor="#1a1917"
          onEnd={() => onChange(ref.current?.isEmpty() ? null : ref.current.toDataURL("image/png"))}
          canvasProps={{ className: "w-full h-full cursor-crosshair" }}
        />
      </div>
    </div>
  );
}
