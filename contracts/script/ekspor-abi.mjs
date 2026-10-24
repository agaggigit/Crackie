// Menulis ABI, alamat, dan blok deploy JebolVault ke web/src/abi/JebolVault.ts.
// Jalankan dari folder contracts/ setelah `forge build` dan deploy:
//   node script/ekspor-abi.mjs
import { readFileSync, writeFileSync } from "node:fs";

const CHAIN_ID = 10143;
const artefak = JSON.parse(readFileSync("out/JebolVault.sol/JebolVault.json", "utf8"));
const broadcast = JSON.parse(
  readFileSync(`broadcast/Deploy.s.sol/${CHAIN_ID}/run-latest.json`, "utf8"),
);

const tx = broadcast.transactions.find(
  (t) => t.transactionType === "CREATE" && t.contractName === "JebolVault",
);
if (!tx) throw new Error("Transaksi deploy JebolVault tidak ditemukan di broadcast");

const receipt = broadcast.receipts.find((r) => r.transactionHash === tx.hash);
const alamat = tx.contractAddress;
const blok = BigInt(receipt.blockNumber);

const isi = `// Dibuat otomatis oleh contracts/script/ekspor-abi.mjs. Jangan diedit manual.
// JebolVault di Monad testnet (${CHAIN_ID}). Tx deploy: ${tx.hash}
export const JEBOL_VAULT_ADDRESS = "${alamat}" as const;
export const JEBOL_VAULT_DEPLOY_BLOCK = ${blok}n;
export const jebolVaultAbi = ${JSON.stringify(artefak.abi, null, 2)} as const;
`;

writeFileSync("../web/src/abi/JebolVault.ts", isi);
console.log(`Ditulis: ${alamat} (blok ${blok})`);
