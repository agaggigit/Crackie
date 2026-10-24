// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test, console} from "forge-std/Test.sol";
import {CrackieVault} from "../src/CrackieVault.sol";

interface IIdentityRegistry {
    function register() external returns (uint256 agentId);
}

interface IReputationRegistryBaca {
    function getLastIndex(uint256 agentId, address clientAddress) external view returns (uint64);
}

/// @notice Ukur gas `bayar` terhadap registry ERC-8004 asli di fork Monad testnet.
/// @dev forge test --match-path test/CrackieVault.fork.t.sol --fork-url monad_testnet -vv
///      Angka ini memakai harga gas Ethereum (EVM lokal), bukan Monad. Di Monad akses akun dingin
///      10.100 (bukan 2.600) dan slot dingin 8.100 (bukan 2.100), jadi angka asli lebih besar.
///      Angka final untuk BE wajib dari `cast estimate` ke RPC testnet setelah deploy.
contract CrackieVaultForkTest is Test {
    address constant IDENTITY = 0x8004A818BFB912233c491871b3d84c89A494BD9e;
    address constant REPUTATION = 0x8004B663056A597Dffe9eCcC1965A193B7388713;

    CrackieVault vault;
    address pemilik = makeAddr("pemilik");
    address agent = makeAddr("agent");
    address supplier = makeAddr("supplier");
    address penyerang = makeAddr("penyerang");
    uint256 agentId;

    function setUp() public {
        if (block.chainid != 10143) return;

        vault = new CrackieVault(pemilik, agent, 0.1 ether, 0.5 ether, 300, keccak256("kopibot"));
        vm.deal(pemilik, 10 ether);

        vm.prank(pemilik);
        agentId = IIdentityRegistry(IDENTITY).register();

        vm.startPrank(pemilik);
        vault.setorUtama{value: 1 ether}();
        vault.isiCelengan{value: 0.2 ether}(block.timestamp + 300);
        vault.aturAllowlist(supplier, true);
        vault.aturErc8004(REPUTATION, agentId);
        vm.stopPrank();
    }

    modifier hanyaFork() {
        if (block.chainid != 10143) return;
        _;
    }

    function test_fork_gasJalurNormal() public hanyaFork {
        vm.prank(agent);
        uint256 awal = gasleft();
        vault.bayar(supplier, 0.05 ether);
        console.log("gas normal:", awal - gasleft());
    }

    function test_fork_gasJalurAlarmDenganErc8004() public hanyaFork {
        vm.prank(agent);
        uint256 awal = gasleft();
        vault.bayar(penyerang, 0.05 ether);
        console.log("gas alarm + ERC-8004:", awal - gasleft());

        assertFalse(_aktif());
        assertEq(penyerang.balance, 0.05 ether);
        assertEq(IReputationRegistryBaca(REPUTATION).getLastIndex(agentId, address(vault)), 1);
    }

    function test_fork_gasJalurRevertSetelahCrackie() public hanyaFork {
        vm.prank(agent);
        vault.bayar(penyerang, 0.05 ether);

        vm.prank(agent);
        uint256 awal = gasleft();
        try vault.bayar(supplier, 0.05 ether) {
            revert("seharusnya revert");
        } catch {}
        console.log("gas revert (setelah crackie):", awal - gasleft());
    }

    /// @dev Cari gas limit transaksi terkecil yang masih menulis ERC-8004.
    function test_fork_batasGasErc8004() public hanyaFork {
        uint256[6] memory limits = [uint256(300_000), 400_000, 450_000, 500_000, 600_000, 700_000];
        for (uint256 i; i < limits.length; i++) {
            uint256 snap = vm.snapshotState();
            vm.prank(agent);
            vault.bayar{gas: limits[i]}(penyerang, 0.05 ether);
            bool tertulis = IReputationRegistryBaca(REPUTATION).getLastIndex(agentId, address(vault)) == 1;
            console.log(limits[i], tertulis ? "ERC-8004 tertulis" : "ERC-8004 dilewati");
            assertFalse(_aktif());
            vm.revertToState(snap);
        }
    }

    function _aktif() private view returns (bool a) {
        (a,,,,,,,,) = vault.status();
    }
}
