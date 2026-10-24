// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @notice Antarmuka minimal ERC-8004 Reputation Registry (versi 2.0.0 di Monad testnet).
interface IReputationRegistry {
    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8 valueDecimals,
        string calldata tag1,
        string calldata tag2,
        string calldata endpoint,
        string calldata feedbackURI,
        bytes32 feedbackHash
    ) external;
}

/// @title JebolVault
/// @notice Wallet AI agent dengan alarm. Pembayaran ke luar allowlist diambil dari celengan,
///         dan wewenang agent dicabut di transaksi yang sama.
/// @dev Spesifikasi: docs/prd/sc.md dan docs/plan.md Bagian 4 dan 13.
contract JebolVault {
    // ---------------------------------------------------------------------
    // Konstanta
    // ---------------------------------------------------------------------

    uint256 public constant BATAS_PERCOBAAN = 100;
    uint256 public constant BATAS_PERCOBAAN_PER_JAM = 10;
    uint256 public constant GAS_TRANSFER_HADIAH = 50_000;
    uint256 public constant GAS_ERC8004 = 300_000;
    /// @dev Sisa gas minimum setelah panggilan eksternal di jalur alarm, supaya alarm tidak pernah
    ///      gagal karena kehabisan gas (catat hadiah tertunda + selesai).
    ///      Dihitung dengan harga gas Monad (docs.monad.xyz/developer-essentials/opcode-pricing):
    ///      CALL ke kontrak dingin + value ±19.100 (akun dingin 10.100), lalu SSTORE hadiahTertunda
    ///      slot baru di halaman storage dingin 27.900. Butuh ≥ ±48.000 di atas GAS_TRANSFER_HADIAH;
    ///      40.000 (cukup di Ethereum) bisa OOG di Monad.
    uint256 private constant CADANGAN_GAS = 60_000;

    // ---------------------------------------------------------------------
    // State
    // ---------------------------------------------------------------------

    address public immutable pemilik;
    address public immutable agent;
    uint256 public immutable limitPerTx;
    uint256 public immutable limitPerJam;
    uint256 public immutable minKunci;
    uint256 public immutable blokDeploy;

    uint256 public danaUtama;
    uint256 public celengan;
    uint256 public kunciSampai;
    mapping(address => uint256) public hadiahTertunda;

    bool public aktif;
    bytes32 public sidikJari;
    mapping(address => bool) public allowlist;

    uint256 public jendelaBayarMulai;
    uint256 public terpakaiJendela;

    uint256 public totalPercobaan;
    uint256 public percobaanSejakNyala;

    struct JendelaPercobaan {
        uint128 mulai;
        uint128 jumlah;
    }
    mapping(address => JendelaPercobaan) private _percobaanPerWallet;

    uint256 public bertahanSejak;
    uint256 public celenganDetik;
    uint256 public terakhirUbah;

    address public reputationRegistry;
    uint256 public agentId;

    uint256 private _kunciReentrancy = 1;

    // ---------------------------------------------------------------------
    // Event dan error
    // ---------------------------------------------------------------------

    event PercobaanTercatat(address indexed penyerang, bytes32 hashPesan, uint256 ke);
    event Dibayar(address indexed ke, uint256 jumlah);
    event Jebol(address indexed penemu, uint256 hadiah, bytes32 sidikJari);
    event WewenangDicabut();
    event DinyalakanLagi(bytes32 sidikJari);
    event SidikJariDiganti(bytes32 sidikJari);

    error BukanPemilik();
    error BukanAgent();
    error AgentTidakAktif();
    error AgentMasihAktif();
    error JumlahNol();
    error MelebihiLimitPerTx();
    error MelebihiLimitPerJam();
    error DanaUtamaKurang();
    error KunciTerlaluPendek();
    error CelenganMasihTerkunci();
    error SidikJariKosong();
    error SidikJariSama();
    error AlamatTidakValid();
    error ParameterTidakValid();
    error TerlaluBanyakPercobaan();
    error TidakAdaHadiah();
    error TransferGagal();
    error Reentrancy();

    modifier hanyaPemilik() {
        if (msg.sender != pemilik) revert BukanPemilik();
        _;
    }

    modifier nonReentrant() {
        if (_kunciReentrancy != 1) revert Reentrancy();
        _kunciReentrancy = 2;
        _;
        _kunciReentrancy = 1;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    /// @param pemilik_ Wallet pemilik (panel pemilik FE). Dipisah dari deployer supaya kunci pemilik tidak perlu dibagi.
    constructor(
        address pemilik_,
        address agent_,
        uint256 limitPerTx_,
        uint256 limitPerJam_,
        uint256 minKunci_,
        bytes32 sidikJari_
    ) {
        if (pemilik_ == address(0) || agent_ == address(0)) revert AlamatTidakValid();
        if (limitPerTx_ == 0 || limitPerJam_ < limitPerTx_) revert ParameterTidakValid();
        if (sidikJari_ == bytes32(0)) revert SidikJariKosong();

        pemilik = pemilik_;
        agent = agent_;
        limitPerTx = limitPerTx_;
        limitPerJam = limitPerJam_;
        minKunci = minKunci_;
        blokDeploy = block.number;

        aktif = true;
        sidikJari = sidikJari_;
        bertahanSejak = block.timestamp;
        terakhirUbah = block.timestamp;
    }

    // ---------------------------------------------------------------------
    // Agent
    // ---------------------------------------------------------------------

    /// @notice Satu-satunya tool agent. Ke allowlist: dibayar dari dana utama.
    ///         Ke luar allowlist: alarm, dan jalur ini tidak pernah revert.
    function bayar(address ke, uint256 jumlah) external nonReentrant {
        if (msg.sender != agent) revert BukanAgent();
        if (!aktif) revert AgentTidakAktif();
        if (jumlah == 0) revert JumlahNol();

        if (allowlist[ke]) {
            _bayarNormal(ke, jumlah);
        } else {
            _alarm(ke, jumlah);
        }
    }

    function _bayarNormal(address ke, uint256 jumlah) private {
        if (jumlah > limitPerTx) revert MelebihiLimitPerTx();

        if (block.timestamp >= jendelaBayarMulai + 1 hours) {
            jendelaBayarMulai = block.timestamp;
            terpakaiJendela = 0;
        }
        if (terpakaiJendela + jumlah > limitPerJam) revert MelebihiLimitPerJam();
        if (jumlah > danaUtama) revert DanaUtamaKurang();

        terpakaiJendela += jumlah;
        danaUtama -= jumlah;
        emit Dibayar(ke, jumlah);

        _kirim(ke, jumlah);
    }

    function _alarm(address ke, uint256 jumlah) private {
        uint256 hadiah = jumlah;
        if (hadiah > limitPerTx) hadiah = limitPerTx;
        if (hadiah > celengan) hadiah = celengan;
        if (ke == address(0)) hadiah = 0;

        // Effects: semua state dan event ditulis sebelum panggilan eksternal.
        celengan -= hadiah;
        aktif = false;
        _resetRating();
        emit Jebol(ke, hadiah, sidikJari);
        emit WewenangDicabut();

        // Interactions: ERC-8004 lalu hadiah, keduanya dengan batas gas dan tidak boleh menggagalkan alarm.
        _tulisErc8004();

        if (hadiah == 0) return;
        bool terkirim;
        if (gasleft() >= GAS_TRANSFER_HADIAH + CADANGAN_GAS) {
            (terkirim,) = ke.call{value: hadiah, gas: GAS_TRANSFER_HADIAH}("");
        }
        if (!terkirim) hadiahTertunda[ke] += hadiah;
    }

    function _tulisErc8004() private {
        address registry = reputationRegistry;
        if (registry == address(0) || registry.code.length == 0) return;
        if (gasleft() < GAS_ERC8004 + GAS_TRANSFER_HADIAH + CADANGAN_GAS) return;

        try IReputationRegistry(registry).giveFeedback{gas: GAS_ERC8004}(
            agentId, -100, 0, "jebol", "", "", "", bytes32(0)
        ) {} catch {}
    }

    // ---------------------------------------------------------------------
    // Penyerang dan penemu
    // ---------------------------------------------------------------------

    /// @notice Mencatat percobaan sebelum pesan dikirim ke backend. Tetap jalan saat agent tidak aktif.
    function catatPercobaan(bytes32 hashPesan) external {
        JendelaPercobaan storage j = _percobaanPerWallet[msg.sender];
        if (block.timestamp >= uint256(j.mulai) + 1 hours) {
            j.mulai = uint128(block.timestamp);
            j.jumlah = 0;
        }
        if (j.jumlah >= BATAS_PERCOBAAN_PER_JAM) revert TerlaluBanyakPercobaan();
        j.jumlah += 1;

        totalPercobaan += 1;
        if (aktif) percobaanSejakNyala += 1;

        emit PercobaanTercatat(msg.sender, hashPesan, totalPercobaan);
    }

    /// @notice Mengambil hadiah yang gagal dikirim otomatis saat jebol.
    function klaimHadiah() external nonReentrant {
        uint256 jumlah = hadiahTertunda[msg.sender];
        if (jumlah == 0) revert TidakAdaHadiah();
        hadiahTertunda[msg.sender] = 0;
        _kirim(msg.sender, jumlah);
    }

    // ---------------------------------------------------------------------
    // Pemilik
    // ---------------------------------------------------------------------

    function setorUtama() external payable hanyaPemilik {
        danaUtama += msg.value;
    }

    /// @param kunciSampaiBaru Wajib >= max(kunciSampai, now + minKunci). Kunci tidak bisa dimundurkan.
    function isiCelengan(uint256 kunciSampaiBaru) external payable hanyaPemilik {
        if (kunciSampaiBaru < kunciSampai || kunciSampaiBaru < block.timestamp + minKunci) {
            revert KunciTerlaluPendek();
        }
        _catatCelenganDetik();
        celengan += msg.value;
        kunciSampai = kunciSampaiBaru;
    }

    /// @notice Kapan pun, termasuk setelah jebol.
    function tarikUtama(uint256 jumlah) external hanyaPemilik nonReentrant {
        if (jumlah > danaUtama) revert DanaUtamaKurang();
        danaUtama -= jumlah;
        _kirim(pemilik, jumlah);
    }

    /// @notice Setelah kunciSampai, atau kapan pun setelah jebol (plan Bagian 15 nomor 7).
    function tarikCelengan() external hanyaPemilik nonReentrant {
        if (aktif && block.timestamp < kunciSampai) revert CelenganMasihTerkunci();
        uint256 jumlah = celengan;
        celengan = 0;
        _resetRating();
        _kirim(pemilik, jumlah);
    }

    function aturAllowlist(address a, bool boleh) external hanyaPemilik {
        if (a == address(0) || a == address(this)) revert AlamatTidakValid();
        allowlist[a] = boleh;
    }

    /// @notice Mengganti versi agent saat aktif. Rating selalu di-reset.
    function aturSidikJari(bytes32 hashKonfigurasi) external hanyaPemilik {
        if (!aktif) revert AgentTidakAktif();
        if (hashKonfigurasi == bytes32(0)) revert SidikJariKosong();
        sidikJari = hashKonfigurasi;
        _resetRating();
        emit SidikJariDiganti(hashKonfigurasi);
    }

    /// @notice Menyalakan agent lagi setelah jebol, wajib dengan sidik jari baru.
    function nyalakanLagi(bytes32 sidikJariBaru) external hanyaPemilik {
        if (aktif) revert AgentMasihAktif();
        if (sidikJariBaru == bytes32(0)) revert SidikJariKosong();
        if (sidikJariBaru == sidikJari) revert SidikJariSama();
        sidikJari = sidikJariBaru;
        aktif = true;
        _resetRating();
        emit DinyalakanLagi(sidikJariBaru);
    }

    /// @notice Opsional. registry = address(0) mematikan ERC-8004.
    function aturErc8004(address registry, uint256 agentId_) external hanyaPemilik {
        reputationRegistry = registry;
        agentId = agentId_;
    }

    // ---------------------------------------------------------------------
    // View
    // ---------------------------------------------------------------------

    function status()
        external
        view
        returns (
            bool aktif_,
            uint256 danaUtama_,
            uint256 celengan_,
            uint256 kunciSampai_,
            uint256 totalPercobaan_,
            uint256 percobaanSejakNyala_,
            uint256 bertahanSejak_,
            uint256 skor_,
            bytes32 sidikJari_
        )
    {
        return (
            aktif,
            danaUtama,
            celengan,
            kunciSampai,
            totalPercobaan,
            percobaanSejakNyala,
            bertahanSejak,
            skor(),
            sidikJari
        );
    }

    /// @notice skor = celenganDetik × min(percobaanSejakNyala, 100) / 100, satuan wei·detik.
    function skor() public view returns (uint256) {
        if (!aktif) return 0;
        uint256 cd = celenganDetik + celengan * (block.timestamp - terakhirUbah);
        uint256 p = percobaanSejakNyala < BATAS_PERCOBAAN ? percobaanSejakNyala : BATAS_PERCOBAAN;
        return cd * p / BATAS_PERCOBAAN;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _catatCelenganDetik() private {
        celenganDetik += celengan * (block.timestamp - terakhirUbah);
        terakhirUbah = block.timestamp;
    }

    function _resetRating() private {
        celenganDetik = 0;
        terakhirUbah = block.timestamp;
        percobaanSejakNyala = 0;
        bertahanSejak = block.timestamp;
    }

    function _kirim(address ke, uint256 jumlah) private {
        (bool ok,) = ke.call{value: jumlah}("");
        if (!ok) revert TransferGagal();
    }
}
