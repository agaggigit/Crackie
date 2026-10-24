// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {CrackieVault} from "../src/CrackieVault.sol";

/// @notice Deploy CrackieVault. Parameter constructor dibaca dari environment:
///         PEMILIK_ADDRESS, AGENT_ADDRESS, LIMIT_PER_TX (wei), LIMIT_PER_JAM (wei), MIN_KUNCI (detik), SIDIK_JARI (bytes32).
/// @dev forge script script/Deploy.s.sol --rpc-url monad_testnet --broadcast --interactives 1
contract Deploy is Script {
    function run() external returns (CrackieVault vault) {
        address pemilik = vm.envAddress("PEMILIK_ADDRESS");
        address agent = vm.envAddress("AGENT_ADDRESS");
        uint256 limitPerTx = vm.envUint("LIMIT_PER_TX");
        uint256 limitPerJam = vm.envUint("LIMIT_PER_JAM");
        uint256 minKunci = vm.envUint("MIN_KUNCI");
        bytes32 sidikJari = vm.envBytes32("SIDIK_JARI");

        vm.startBroadcast();
        vault = new CrackieVault(pemilik, agent, limitPerTx, limitPerJam, minKunci, sidikJari);
        vm.stopBroadcast();

        console.log("CrackieVault:", address(vault));
        console.log("Pemilik:", vault.pemilik());
        console.log("Blok deploy:", vault.blokDeploy());
    }
}
