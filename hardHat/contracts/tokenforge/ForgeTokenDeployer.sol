// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ForgeToken} from "./ForgeToken.sol";
import {TokenConfig} from "./ForgeTypes.sol";

/**
 * @title ForgeTokenDeployer
 * @author CertifiedBlockchain (TokenForge)
 * @notice Thin deploy helper that embeds ForgeToken's creation code, keeping the
 *         Factory's own deployed bytecode well under the 24 KB EIP-170 limit.
 * @dev The factory calls `deploy`, which constructs a ForgeToken whose owner is
 *      set to the buyer inside the token constructor (no post-deploy ownership
 *      transfer needed). This contract never holds funds or special powers.
 */
contract ForgeTokenDeployer {
    /// @notice Deploy a new ForgeToken from the given config.
    /// @return token address of the freshly deployed token
    function deploy(TokenConfig calldata cfg) external returns (address token) {
        ForgeToken t = new ForgeToken(cfg);
        return address(t);
    }
}
