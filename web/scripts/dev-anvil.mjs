// npm run dev:anvil -- <alamatVaultDiAnvil>
// next dev diarahkan ke anvil (127.0.0.1:8545, chain 31337) tanpa mengubah .env.local.
// Env proses menimpa .env.local, jadi RPC testnet di .env.local tetap utuh.
import { spawn } from "node:child_process";

const vault = process.argv[2] ?? process.env.JEBOL_VAULT_ALAMAT;
if (!vault) {
  console.error("Pakai: npm run dev:anvil -- <alamatVaultDiAnvil>");
  process.exit(1);
}

const env = {
  ...process.env,
  NEXT_PUBLIC_RPC_URL: "http://127.0.0.1:8545",
  NEXT_PUBLIC_CHAIN_ID: "31337",
  RPC_URL_CADANGAN: "http://127.0.0.1:8545",
  JEBOL_VAULT_ALAMAT: vault,
  BAYAR_PALSU: "0",
};
console.log(`next dev → anvil, vault ${vault}`);
spawn("npx", ["next", "dev", "-p", process.env.PORT ?? "3000"], { env, stdio: "inherit", shell: true }).on("exit", (k) =>
  process.exit(k ?? 0),
);
