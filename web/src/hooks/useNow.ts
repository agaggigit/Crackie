"use client";

import { useEffect, useState } from "react";

// Waktu sekarang (detik), diperbarui tiap `intervalMs`. Bernilai 0 saat prerender, terisi setelah mount.
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Math.floor(Date.now() / 1000));
    tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
