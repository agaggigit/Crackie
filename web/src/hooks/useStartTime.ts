"use client";

import { useSyncExternalStore } from "react";

let mulai = 0;
const waktuMulai = () => (mulai ||= Math.floor(Date.now() / 1000));
const noop = () => () => {};

// Waktu (detik) saat halaman pertama dibuka di browser. Bernilai 0 saat prerender. Dipakai untuk data demo.
export function useStartTime(): number {
  return useSyncExternalStore(noop, waktuMulai, () => 0);
}
