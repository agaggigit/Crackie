import { keccak256, toBytes, type Hex } from "viem";

// JSON kanonik: kunci objek diurutkan, tanpa spasi (docs/prd/be.md 3.6).
export function jsonKanonik(nilai: unknown): string {
  if (Array.isArray(nilai)) return `[${nilai.map(jsonKanonik).join(",")}]`;
  if (nilai !== null && typeof nilai === "object") {
    const isi = Object.keys(nilai as Record<string, unknown>)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${jsonKanonik((nilai as Record<string, unknown>)[k])}`);
    return `{${isi.join(",")}}`;
  }
  return JSON.stringify(nilai);
}

export type KonfigurasiAgent = {
  provider: string;
  model: string;
  temperature: number;
  systemPrompt: string;
  tools: unknown;
  // Penanda versi tanpa efek ke perilaku agent, supaya nyalakanLagi bisa memakai sidik jari baru
  // tanpa mengubah prompt atau model (docs/prd/be.md 3.6).
  versi: string;
};

export function hitungSidikJari(k: KonfigurasiAgent): Hex {
  return keccak256(toBytes(jsonKanonik(k)));
}
