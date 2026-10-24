// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {CrackieVault} from "../src/CrackieVault.sol";

// -------------------------------------------------------------------------
// Mock
// -------------------------------------------------------------------------

contract PenolakMON {
    receive() external payable {
        revert("tolak");
    }
}

contract PemakanGas {
    receive() external payable {
        while (true) {}
    }
}

/// @dev Awalnya menolak MON (hadiah jadi tertunda), lalu saat klaim mencoba masuk ulang.
contract PenyerangReentrancy {
    CrackieVault public vault;
    bool public tolak = true;
    bool public masukUlangBerhasil;

    constructor(CrackieVault v) {
        vault = v;
    }

    function aturTolak(bool t) external {
        tolak = t;
    }

    function klaim() external {
        vault.klaimHadiah();
    }

    receive() external payable {
        if (tolak) revert("tolak");
        (bool ok,) = address(vault).call(abi.encodeCall(CrackieVault.klaimHadiah, ()));
        masukUlangBerhasil = ok;
    }
}

contract RegistryMock {
    uint256 public jumlahPanggilan;
    uint256 public agentIdTerakhir;
    int128 public nilaiTerakhir;
    string public tagTerakhir;

    function giveFeedback(
        uint256 agentId,
        int128 value,
        uint8,
        string calldata tag1,
        string calldata,
        string calldata,
        string calldata,
        bytes32
    ) external {
        jumlahPanggilan++;
        agentIdTerakhir = agentId;
        nilaiTerakhir = value;
        tagTerakhir = tag1;
    }
}

contract RegistryRevert {
    function giveFeedback(uint256, int128, uint8, string calldata, string calldata, string calldata, string calldata, bytes32)
        external
        pure
    {
        revert("Self-feedback not allowed");
    }
}

contract RegistryPemakanGas {
    function giveFeedback(uint256, int128, uint8, string calldata, string calldata, string calldata, string calldata, bytes32)
        external
        pure
    {
        while (true) {}
    }
}

// -------------------------------------------------------------------------
// Test
// -------------------------------------------------------------------------

contract CrackieVaultTest is Test {
    CrackieVault vault;

    address pemilik = makeAddr("pemilik");
    address agent = makeAddr("agent");
    address supplier = makeAddr("supplier");
    address penyerang = makeAddr("penyerang");
    address orangLain = makeAddr("orangLain");

    uint256 constant LIMIT_PER_TX = 0.1 ether;
    uint256 constant LIMIT_PER_JAM = 0.25 ether;
    uint256 constant MIN_KUNCI = 5 minutes;
    bytes32 constant SIDIK_JARI = keccak256("kopibot-v1");
    bytes32 constant SIDIK_JARI_2 = keccak256("kopibot-v2");

    event PercobaanTercatat(address indexed penyerang, bytes32 hashPesan, uint256 ke);
    event Dibayar(address indexed ke, uint256 jumlah);
    event Crackie(address indexed penemu, uint256 hadiah, bytes32 sidikJari);
    event WewenangDicabut();
    event DinyalakanLagi(bytes32 sidikJari);
    event SidikJariDiganti(bytes32 sidikJari);

    function setUp() public {
        vm.deal(pemilik, 100 ether);
        vm.startPrank(pemilik);
        vault = new CrackieVault(pemilik, agent, LIMIT_PER_TX, LIMIT_PER_JAM, MIN_KUNCI, SIDIK_JARI);
        vault.setorUtama{value: 1 ether}();
        vault.isiCelengan{value: 0.5 ether}(block.timestamp + MIN_KUNCI);
        vault.aturAllowlist(supplier, true);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------------
    // Helper
    // ---------------------------------------------------------------------

    function _crackie(address ke, uint256 jumlah) internal {
        vm.prank(agent);
        vault.bayar(ke, jumlah);
    }

    function _catat(address dari, bytes32 h) internal {
        vm.prank(dari);
        vault.catatPercobaan(h);
    }

    function _aktif() internal view returns (bool a) {
        (a,,,,,,,,) = vault.status();
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    function test_constructor_mengisiState() public view {
        assertEq(vault.pemilik(), pemilik);
        assertEq(vault.agent(), agent);
        assertEq(vault.limitPerTx(), LIMIT_PER_TX);
        assertEq(vault.limitPerJam(), LIMIT_PER_JAM);
        assertEq(vault.minKunci(), MIN_KUNCI);
        assertEq(vault.blokDeploy(), block.number);
        assertEq(vault.sidikJari(), SIDIK_JARI);
        assertTrue(_aktif());
    }

    function test_constructor_parameterTidakValid() public {
        vm.expectRevert(CrackieVault.AlamatTidakValid.selector);
        new CrackieVault(pemilik, address(0), LIMIT_PER_TX, LIMIT_PER_JAM, MIN_KUNCI, SIDIK_JARI);
        vm.expectRevert(CrackieVault.AlamatTidakValid.selector);
        new CrackieVault(address(0), agent, LIMIT_PER_TX, LIMIT_PER_JAM, MIN_KUNCI, SIDIK_JARI);
        vm.expectRevert(CrackieVault.ParameterTidakValid.selector);
        new CrackieVault(pemilik, agent, 0, LIMIT_PER_JAM, MIN_KUNCI, SIDIK_JARI);
        vm.expectRevert(CrackieVault.ParameterTidakValid.selector);
        new CrackieVault(pemilik, agent, LIMIT_PER_TX, LIMIT_PER_TX - 1, MIN_KUNCI, SIDIK_JARI);
        vm.expectRevert(CrackieVault.SidikJariKosong.selector);
        new CrackieVault(pemilik, agent, LIMIT_PER_TX, LIMIT_PER_JAM, MIN_KUNCI, bytes32(0));
    }

    // ---------------------------------------------------------------------
    // Jalur normal
    // ---------------------------------------------------------------------

    function test_normal_bayarKeAllowlist() public {
        vm.expectEmit(address(vault));
        emit Dibayar(supplier, 0.05 ether);
        vm.prank(agent);
        vault.bayar(supplier, 0.05 ether);

        assertEq(supplier.balance, 0.05 ether);
        assertEq(vault.danaUtama(), 0.95 ether);
        assertEq(vault.celengan(), 0.5 ether);
        assertTrue(_aktif());
    }

    function test_normal_melebihiLimitPerTx() public {
        vm.prank(agent);
        vm.expectRevert(CrackieVault.MelebihiLimitPerTx.selector);
        vault.bayar(supplier, LIMIT_PER_TX + 1);
    }

    function test_normal_melebihiLimitPerJam_laluResetSetelahSejam() public {
        vm.startPrank(agent);
        vault.bayar(supplier, 0.1 ether);
        vault.bayar(supplier, 0.1 ether);
        vm.expectRevert(CrackieVault.MelebihiLimitPerJam.selector);
        vault.bayar(supplier, 0.1 ether);

        vm.warp(block.timestamp + 1 hours);
        vault.bayar(supplier, 0.1 ether);
        vm.stopPrank();
        assertEq(supplier.balance, 0.3 ether);
    }

    function test_normal_danaUtamaKurang() public {
        vm.prank(pemilik);
        vault.tarikUtama(0.98 ether);
        vm.prank(agent);
        vm.expectRevert(CrackieVault.DanaUtamaKurang.selector);
        vault.bayar(supplier, 0.05 ether);
    }

    function test_normal_bukanAgent() public {
        vm.prank(penyerang);
        vm.expectRevert(CrackieVault.BukanAgent.selector);
        vault.bayar(supplier, 0.01 ether);
    }

    function test_normal_jumlahNol() public {
        vm.prank(agent);
        vm.expectRevert(CrackieVault.JumlahNol.selector);
        vault.bayar(supplier, 0);
    }

    // ---------------------------------------------------------------------
    // Jalur alarm
    // ---------------------------------------------------------------------

    function test_alarm_atomik() public {
        vm.expectEmit(address(vault));
        emit Crackie(penyerang, 0.05 ether, SIDIK_JARI);
        vm.expectEmit(address(vault));
        emit WewenangDicabut();
        _crackie(penyerang, 0.05 ether);

        assertFalse(_aktif());
        assertEq(penyerang.balance, 0.05 ether);
        assertEq(vault.celengan(), 0.45 ether);
        assertEq(vault.danaUtama(), 1 ether, "dana utama tidak tersentuh");
    }

    function test_alarm_jumlahDiAtasLimit_tidakRevert() public {
        _crackie(penyerang, 5 ether);
        assertFalse(_aktif());
        assertEq(penyerang.balance, LIMIT_PER_TX);
    }

    function test_alarm_celenganKurang_hadiahSisaCelengan() public {
        CrackieVault v = _vaultCelengan(0.03 ether);
        vm.prank(agent);
        v.bayar(penyerang, 0.1 ether);
        assertEq(penyerang.balance, 0.03 ether);
        assertEq(v.celengan(), 0);
    }

    function test_alarm_celenganKosong_tetapBerbunyi() public {
        CrackieVault v = _vaultCelengan(0);
        vm.expectEmit(address(v));
        emit Crackie(penyerang, 0, SIDIK_JARI);
        vm.prank(agent);
        v.bayar(penyerang, 0.1 ether);
        (bool a,,,,,,,,) = v.status();
        assertFalse(a);
        assertEq(penyerang.balance, 0);
    }

    function test_alarm_alamatNol_hadiahNol() public {
        _crackie(address(0), 0.05 ether);
        assertFalse(_aktif());
        assertEq(vault.celengan(), 0.5 ether);
    }

    function test_alarm_penerimaMenolak_hadiahTertunda() public {
        PenolakMON penolak = new PenolakMON();
        _crackie(address(penolak), 0.05 ether);

        assertFalse(_aktif());
        assertEq(vault.hadiahTertunda(address(penolak)), 0.05 ether);

        vm.prank(orangLain);
        vm.expectRevert(CrackieVault.TidakAdaHadiah.selector);
        vault.klaimHadiah();
    }

    function test_alarm_penerimaPemakanGas_tidakRevert() public {
        PemakanGas pemakan = new PemakanGas();
        _crackie(address(pemakan), 0.05 ether);
        assertFalse(_aktif());
        assertEq(vault.hadiahTertunda(address(pemakan)), 0.05 ether);
    }

    function test_alarm_reentrancySaatKlaim_gagal() public {
        PenyerangReentrancy r = new PenyerangReentrancy(vault);
        _crackie(address(r), 0.05 ether);
        assertEq(vault.hadiahTertunda(address(r)), 0.05 ether);

        r.aturTolak(false);
        r.klaim();
        assertFalse(r.masukUlangBerhasil());
        assertEq(address(r).balance, 0.05 ether);
        assertEq(vault.hadiahTertunda(address(r)), 0);
    }

    function test_alarm_erc8004Berhasil() public {
        RegistryMock reg = new RegistryMock();
        vm.prank(pemilik);
        vault.aturErc8004(address(reg), 42);

        _crackie(penyerang, 0.05 ether);
        assertEq(reg.jumlahPanggilan(), 1);
        assertEq(reg.agentIdTerakhir(), 42);
        assertEq(reg.nilaiTerakhir(), -100);
        assertEq(reg.tagTerakhir(), "crackie");
    }

    function test_alarm_erc8004Revert_alarmTetapJalan() public {
        RegistryRevert reg = new RegistryRevert();
        vm.prank(pemilik);
        vault.aturErc8004(address(reg), 1);
        _crackie(penyerang, 0.05 ether);
        assertFalse(_aktif());
        assertEq(penyerang.balance, 0.05 ether);
    }

    function test_alarm_erc8004PemakanGas_alarmTetapJalan() public {
        RegistryPemakanGas reg = new RegistryPemakanGas();
        vm.prank(pemilik);
        vault.aturErc8004(address(reg), 1);
        _crackie(penyerang, 0.05 ether);
        assertFalse(_aktif());
        assertEq(penyerang.balance, 0.05 ether);
    }

    function test_alarm_erc8004BukanKontrak_dilewati() public {
        vm.prank(pemilik);
        vault.aturErc8004(makeAddr("eoa"), 1);
        _crackie(penyerang, 0.05 ether);
        assertFalse(_aktif());
    }

    function test_alarm_gasMinim_erc8004DilewatiAlarmTetapJalan() public {
        RegistryMock reg = new RegistryMock();
        vm.prank(pemilik);
        vault.aturErc8004(address(reg), 1);

        vm.prank(agent);
        vault.bayar{gas: 200_000}(penyerang, 0.05 ether);
        assertFalse(_aktif());
        assertEq(reg.jumlahPanggilan(), 0);
        assertEq(penyerang.balance, 0.05 ether);
    }

    function testFuzz_alarm_tidakPernahRevert(address ke, uint256 jumlah) public {
        vm.assume(!vault.allowlist(ke));
        vm.assume(ke != address(vm) && ke != CONSOLE && ke != CREATE2_FACTORY);
        assumeNotPrecompile(ke);
        jumlah = bound(jumlah, 1, type(uint256).max);

        uint256 celenganAwal = vault.celengan();
        _crackie(ke, jumlah);

        assertFalse(_aktif());
        uint256 hadiahMaks = jumlah < LIMIT_PER_TX ? jumlah : LIMIT_PER_TX;
        assertGe(vault.celengan(), celenganAwal - hadiahMaks);
    }

    // ---------------------------------------------------------------------
    // Setelah crackie
    // ---------------------------------------------------------------------

    function test_setelahCrackie_bayarRevert() public {
        _crackie(penyerang, 0.05 ether);
        vm.startPrank(agent);
        vm.expectRevert(CrackieVault.AgentTidakAktif.selector);
        vault.bayar(penyerang, 0.05 ether);
        vm.expectRevert(CrackieVault.AgentTidakAktif.selector);
        vault.bayar(supplier, 0.01 ether);
        vm.stopPrank();
    }

    function test_setelahCrackie_catatPercobaanTetapJalan() public {
        _catat(penyerang, keccak256("a"));
        _crackie(penyerang, 0.05 ether);
        _catat(penyerang, keccak256("b"));

        (,,,, uint256 total, uint256 sejakNyala,,,) = vault.status();
        assertEq(total, 2);
        assertEq(sejakNyala, 0);
    }

    function test_setelahCrackie_pemilikTarikUtamaDanCelengan() public {
        _crackie(penyerang, 0.05 ether);
        uint256 awal = pemilik.balance;

        vm.startPrank(pemilik);
        vault.tarikUtama(1 ether);
        vault.tarikCelengan(); // sebelum kunciSampai, boleh karena sudah crackie
        vm.stopPrank();

        assertEq(pemilik.balance - awal, 1.45 ether);
        assertEq(address(vault).balance, 0);
    }

    function test_setelahCrackie_nyalakanLagi() public {
        _catat(penyerang, keccak256("a"));
        _crackie(penyerang, 0.05 ether);

        vm.startPrank(pemilik);
        vm.expectRevert(CrackieVault.SidikJariSama.selector);
        vault.nyalakanLagi(SIDIK_JARI);
        vm.expectRevert(CrackieVault.SidikJariKosong.selector);
        vault.nyalakanLagi(bytes32(0));

        vm.expectEmit(address(vault));
        emit DinyalakanLagi(SIDIK_JARI_2);
        vault.nyalakanLagi(SIDIK_JARI_2);
        vm.stopPrank();

        (bool a,,,,, uint256 sejakNyala, uint256 bertahan, uint256 s, bytes32 sj) = vault.status();
        assertTrue(a);
        assertEq(sejakNyala, 0);
        assertEq(bertahan, block.timestamp);
        assertEq(s, 0);
        assertEq(sj, SIDIK_JARI_2);

        vm.prank(agent);
        vault.bayar(supplier, 0.01 ether);
    }

    function test_nyalakanLagi_saatAktifRevert() public {
        vm.prank(pemilik);
        vm.expectRevert(CrackieVault.AgentMasihAktif.selector);
        vault.nyalakanLagi(SIDIK_JARI_2);
    }

    // ---------------------------------------------------------------------
    // Celengan dan kunci
    // ---------------------------------------------------------------------

    function test_celengan_tarikSebelumKunciRevert() public {
        vm.prank(pemilik);
        vm.expectRevert(CrackieVault.CelenganMasihTerkunci.selector);
        vault.tarikCelengan();
    }

    function test_celengan_tarikSetelahKunci() public {
        vm.warp(block.timestamp + MIN_KUNCI);
        uint256 awal = pemilik.balance;
        vm.prank(pemilik);
        vault.tarikCelengan();
        assertEq(pemilik.balance - awal, 0.5 ether);
        assertEq(vault.celengan(), 0);
    }

    function test_celengan_kunciTidakBisaDimundurkan() public {
        vm.startPrank(pemilik);
        uint256 kunci = vault.kunciSampai();
        vault.isiCelengan(kunci + 1 hours);

        vm.expectRevert(CrackieVault.KunciTerlaluPendek.selector);
        vault.isiCelengan(kunci);

        vm.warp(block.timestamp + 2 hours);
        vm.expectRevert(CrackieVault.KunciTerlaluPendek.selector);
        vault.isiCelengan(block.timestamp + MIN_KUNCI - 1);
        vm.stopPrank();
    }

    function test_pemilikSaja() public {
        vm.deal(orangLain, 1 ether);
        vm.startPrank(orangLain);
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.setorUtama{value: 1}();
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.tarikUtama(1);
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.tarikCelengan();
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.aturAllowlist(orangLain, true);
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.aturSidikJari(SIDIK_JARI_2);
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.nyalakanLagi(SIDIK_JARI_2);
        vm.expectRevert(CrackieVault.BukanPemilik.selector);
        vault.aturErc8004(address(1), 1);
        vm.stopPrank();
    }

    function test_kirimLangsungDitolak() public {
        vm.deal(orangLain, 1 ether);
        vm.prank(orangLain);
        (bool ok,) = address(vault).call{value: 1 ether}("");
        assertFalse(ok);
    }

    function test_allowlist_alamatTidakValid() public {
        vm.startPrank(pemilik);
        vm.expectRevert(CrackieVault.AlamatTidakValid.selector);
        vault.aturAllowlist(address(0), true);
        vm.expectRevert(CrackieVault.AlamatTidakValid.selector);
        vault.aturAllowlist(address(vault), true);
        vm.stopPrank();
    }

    // ---------------------------------------------------------------------
    // Rating
    // ---------------------------------------------------------------------

    function test_skor_nolTanpaPercobaan() public {
        vm.warp(block.timestamp + 1 hours);
        assertEq(vault.skor(), 0);
    }

    function test_skor_rumus() public {
        for (uint256 i; i < 10; i++) {
            _catat(address(uint160(1000 + i)), keccak256(abi.encode(i)));
        }
        uint256 mulai = block.timestamp;
        vm.warp(mulai + 600);
        // celenganDetik sejak setUp (terakhirUbah = waktu isiCelengan) = 0.5 ether × 600
        assertEq(vault.skor(), 0.5 ether * 600 * 10 / 100);
    }

    function test_skor_dibatasi100Percobaan() public {
        for (uint256 i; i < 120; i++) {
            _catat(address(uint160(1000 + i)), bytes32(i));
        }
        vm.warp(block.timestamp + 100);
        assertEq(vault.skor(), 0.5 ether * 100);
    }

    function test_skor_nolSaatTidakAktif() public {
        _catat(penyerang, bytes32(0));
        vm.warp(block.timestamp + 100);
        _crackie(penyerang, 0.01 ether);
        assertEq(vault.skor(), 0);
    }

    function test_skor_isiCelenganDetikTerakhirTidakMemompa() public {
        for (uint256 i; i < 100; i++) {
            _catat(address(uint160(1000 + i)), bytes32(i));
        }
        vm.warp(block.timestamp + 30 days);
        uint256 sebelum = vault.skor();

        vm.deal(pemilik, 2000 ether);
        vm.prank(pemilik);
        vault.isiCelengan{value: 1000 ether}(block.timestamp + MIN_KUNCI);
        assertEq(vault.skor(), sebelum, "celengan baru belum menambah skor");

        vm.warp(block.timestamp + 1);
        assertEq(vault.skor(), sebelum + 1000.5 ether);
    }

    function test_aturSidikJari_resetRating() public {
        _catat(penyerang, bytes32(0));
        vm.warp(block.timestamp + 100);
        assertGt(vault.skor(), 0);

        vm.expectEmit(address(vault));
        emit SidikJariDiganti(SIDIK_JARI_2);
        vm.prank(pemilik);
        vault.aturSidikJari(SIDIK_JARI_2);

        (,,,, uint256 total, uint256 sejakNyala,, uint256 s, bytes32 sj) = vault.status();
        assertEq(total, 1);
        assertEq(sejakNyala, 0);
        assertEq(s, 0);
        assertEq(sj, SIDIK_JARI_2);
    }

    function test_aturSidikJari_saatTidakAktifRevert() public {
        _crackie(penyerang, 0.01 ether);
        vm.prank(pemilik);
        vm.expectRevert(CrackieVault.AgentTidakAktif.selector);
        vault.aturSidikJari(SIDIK_JARI_2);
    }

    // ---------------------------------------------------------------------
    // Percobaan
    // ---------------------------------------------------------------------

    function test_percobaan_keNaikTerus() public {
        vm.expectEmit(address(vault));
        emit PercobaanTercatat(penyerang, keccak256("a"), 1);
        _catat(penyerang, keccak256("a"));

        _crackie(penyerang, 0.01 ether);
        vm.prank(pemilik);
        vault.nyalakanLagi(SIDIK_JARI_2);

        vm.expectEmit(address(vault));
        emit PercobaanTercatat(penyerang, keccak256("b"), 2);
        _catat(penyerang, keccak256("b"));
    }

    function test_percobaan_batasPerWalletPerJam() public {
        for (uint256 i; i < 10; i++) {
            _catat(penyerang, bytes32(i));
        }
        vm.prank(penyerang);
        vm.expectRevert(CrackieVault.TerlaluBanyakPercobaan.selector);
        vault.catatPercobaan(bytes32(uint256(99)));

        _catat(orangLain, bytes32(0)); // wallet lain tidak terpengaruh

        vm.warp(block.timestamp + 1 hours);
        _catat(penyerang, bytes32(uint256(100)));
    }

    // ---------------------------------------------------------------------
    // Helper vault dengan celengan tertentu
    // ---------------------------------------------------------------------

    function _vaultCelengan(uint256 isi) internal returns (CrackieVault v) {
        vm.startPrank(pemilik);
        v = new CrackieVault(pemilik, agent, LIMIT_PER_TX, LIMIT_PER_JAM, MIN_KUNCI, SIDIK_JARI);
        if (isi > 0) v.isiCelengan{value: isi}(block.timestamp + MIN_KUNCI);
        vm.stopPrank();
    }
}
