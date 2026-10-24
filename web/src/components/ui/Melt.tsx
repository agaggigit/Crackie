// Gradien "bentuk lalu blur" (docs/desain-fe.md Bagian 1): bentuk solid satu tone, diblur sampai melebur.
type Shape = { d: string; fill: string; blur: number };

const VARIANTS: Record<string, Shape[]> = {
  // Oranye naik dari bawah, dipakai di kartu krem.
  rise: [
    { d: "M0 600 C200 420 420 640 800 420 L800 900 L0 900Z", fill: "#FF6A1F", blur: 70 },
    { d: "M0 760 C260 620 520 820 800 640 L800 900 L0 900Z", fill: "#FF8F4D", blur: 60 },
    { d: "M300 900 C420 720 640 760 800 820 L800 900Z", fill: "#FFC9A0", blur: 50 },
  ],
  // Cahaya oranye di pojok bawah, dipakai di kartu navy.
  glow: [
    { d: "M0 900 C120 620 420 560 800 640 L800 900Z", fill: "#FF6A1F", blur: 70 },
    { d: "M300 900 C420 760 620 740 800 780 L800 900Z", fill: "#FFC9A0", blur: 60 },
  ],
  // Meleleh dari pojok kanan atas.
  corner: [
    { d: "M800 0 C640 160 700 420 520 560 C360 680 120 600 0 760 L0 0Z", fill: "#FF6A1F", blur: 80 },
    { d: "M0 0 C200 80 360 0 560 60 L560 300 C360 360 160 260 0 320Z", fill: "#FFC9A0", blur: 80 },
  ],
  // Oranye penuh untuk momen jebol.
  alarm: [
    { d: "M0 520 C200 400 480 620 800 460 L800 900 L0 900Z", fill: "#E24E0A", blur: 80 },
    { d: "M100 0 C300 120 520 40 800 140 L800 360 C520 300 300 380 100 260Z", fill: "#FFC9A0", blur: 90 },
    { d: "M500 600 C600 520 720 560 800 600 L800 900 L500 900Z", fill: "#FF8F4D", blur: 70 },
  ],
};

export type MeltVariant = keyof typeof VARIANTS;

export function Melt({ variant, className = "" }: { variant: MeltVariant; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 800 900"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute -inset-[8%] h-[116%] w-[116%] ${className}`}
    >
      {VARIANTS[variant].map((s, i) => (
        <path key={i} d={s.d} fill={s.fill} style={{ filter: `blur(${s.blur}px)` }} />
      ))}
    </svg>
  );
}
