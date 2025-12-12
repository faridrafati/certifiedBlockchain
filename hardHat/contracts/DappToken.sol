// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DappToken
 * @author CertifiedBlockchain
 * @notice A customizable ERC20 token with configurable decimals
 * @dev Extends OpenZeppelin's ERC20 implementation with custom decimal support.
 *      The initial supply is minted to the deployer's address.
 *
 * Key Features:
 * - Standard ERC20 functionality (transfer, approve, transferFrom)
 * - Configurable token name, symbol, and decimals
 * - Initial supply minted to contract deployer
 *
 * Usage Example:
 * ```javascript
 * // Deploy token with 18 decimals and 1 million initial supply
 * const token = await DappToken.deploy("MyToken", "MTK", 18, 1000000);
 *
 * // Check balance
 * const balance = await token.balanceOf(account);
 *
 * // Transfer tokens
 * await token.transfer(recipient, ethers.parseUnits("100", 18));
 * ```
 */
contract DappToken is ERC20 {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Custom decimal places for this token
    /// @dev Stored separately to override ERC20's default 18 decimals
    uint8 decimal;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys a new ERC20 token with custom parameters
     * @dev Mints the initial supply to msg.sender, adjusted for decimals
     * @param _name The name of the token (e.g., "My Token")
     * @param _symbol The symbol of the token (e.g., "MTK")
     * @param _decimals Number of decimal places (typically 18)
     * @param _initialSupply Initial token supply (before decimal adjustment)
     *
     * Example:
     * - _initialSupply = 1000, _decimals = 18
     * - Actual minted = 1000 * 10^18 = 1000000000000000000000
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint _initialSupply
    ) ERC20(_name, _symbol) {
        decimal = _decimals;
        _mint(msg.sender, _initialSupply * 10 ** uint256(decimal));
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the number of decimal places for this token
     * @dev Overrides ERC20's decimals() to return custom value
     * @return The number of decimal places
     */
    function decimals() public view override virtual returns (uint8) {
        return decimal;
    }
}
