// npm run sidik-jari: cetak hash konfigurasi agent untuk constructor CrackieVault / aturSidikJari.
import { konfigurasiAgent, sidikJariLokal, SUPPLIER } from "../src/lib/agent";

const k = konfigurasiAgent();
console.log(`provider     ${k.provider}`);
console.log(`model        ${k.model}`);
console.log(`temperature  ${k.temperature}`);
console.log(`versi        ${k.versi}`);
console.log(`supplier     ${SUPPLIER.map((s) => s.alamat).join(", ")}`);
console.log(`\nSIDIK_JARI=${sidikJariLokal()}`);
