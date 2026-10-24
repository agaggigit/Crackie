// PLACEHOLDER: kontrak BELUM di-deploy. Alamat nol dan blok 0 akan ditimpa
// contracts/script/ekspor-abi.mjs setelah deploy ke Monad testnet (10143).
// ABI sudah asli (hasil forge build dari contracts/src/JebolVault.sol), aman dipakai untuk tipe.
export const JEBOL_VAULT_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
export const JEBOL_VAULT_DEPLOY_BLOCK = 0n;
export const jebolVaultAbi = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "pemilik_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "agent_",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "limitPerTx_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limitPerJam_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "minKunci_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "sidikJari_",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "BATAS_PERCOBAAN",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "BATAS_PERCOBAAN_PER_JAM",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "GAS_ERC8004",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "GAS_TRANSFER_HADIAH",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "agent",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "agentId",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "aktif",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "allowlist",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "aturAllowlist",
    "inputs": [
      {
        "name": "a",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "boleh",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "aturErc8004",
    "inputs": [
      {
        "name": "registry",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "agentId_",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "aturSidikJari",
    "inputs": [
      {
        "name": "hashKonfigurasi",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "bayar",
    "inputs": [
      {
        "name": "ke",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "jumlah",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "bertahanSejak",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "blokDeploy",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "catatPercobaan",
    "inputs": [
      {
        "name": "hashPesan",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "celengan",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "celenganDetik",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "danaUtama",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hadiahTertunda",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isiCelengan",
    "inputs": [
      {
        "name": "kunciSampaiBaru",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "jendelaBayarMulai",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "klaimHadiah",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "kunciSampai",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "limitPerJam",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "limitPerTx",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "minKunci",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nyalakanLagi",
    "inputs": [
      {
        "name": "sidikJariBaru",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "pemilik",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "percobaanSejakNyala",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "reputationRegistry",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setorUtama",
    "inputs": [],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "sidikJari",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "skor",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "status",
    "inputs": [],
    "outputs": [
      {
        "name": "aktif_",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "danaUtama_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "celengan_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "kunciSampai_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalPercobaan_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "percobaanSejakNyala_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "bertahanSejak_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "skor_",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "sidikJari_",
        "type": "bytes32",
        "internalType": "bytes32"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tarikCelengan",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "tarikUtama",
    "inputs": [
      {
        "name": "jumlah",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "terakhirUbah",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "terpakaiJendela",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalPercobaan",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Dibayar",
    "inputs": [
      {
        "name": "ke",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "jumlah",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "DinyalakanLagi",
    "inputs": [
      {
        "name": "sidikJari",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Jebol",
    "inputs": [
      {
        "name": "penemu",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "hadiah",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "sidikJari",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PercobaanTercatat",
    "inputs": [
      {
        "name": "penyerang",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "hashPesan",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "ke",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SidikJariDiganti",
    "inputs": [
      {
        "name": "sidikJari",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WewenangDicabut",
    "inputs": [],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AgentMasihAktif",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AgentTidakAktif",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlamatTidakValid",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BukanAgent",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BukanPemilik",
    "inputs": []
  },
  {
    "type": "error",
    "name": "CelenganMasihTerkunci",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DanaUtamaKurang",
    "inputs": []
  },
  {
    "type": "error",
    "name": "JumlahNol",
    "inputs": []
  },
  {
    "type": "error",
    "name": "KunciTerlaluPendek",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MelebihiLimitPerJam",
    "inputs": []
  },
  {
    "type": "error",
    "name": "MelebihiLimitPerTx",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ParameterTidakValid",
    "inputs": []
  },
  {
    "type": "error",
    "name": "Reentrancy",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SidikJariKosong",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SidikJariSama",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TerlaluBanyakPercobaan",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TidakAdaHadiah",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TransferGagal",
    "inputs": []
  }
] as const;
