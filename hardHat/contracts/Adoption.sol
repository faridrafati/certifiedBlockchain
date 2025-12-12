// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Adoption
 * @author CertifiedBlockchain
 * @notice A simple pet adoption tracking smart contract
 * @dev This contract manages the adoption of 16 pets (ID 0-15).
 *      Once a pet is adopted, only that adopter's address is recorded.
 *
 * Key Features:
 * - Supports 16 pets with IDs from 0 to 15
 * - Each pet can only be adopted once (first-come, first-served)
 * - Adopter addresses are publicly viewable
 * - Simple and gas-efficient design
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const adoption = await Adoption.deploy();
 *
 * // Adopt pet with ID 3
 * await adoption.adopt(3);
 *
 * // Check all adopters
 * const adopters = await adoption.getAdopters();
 * ```
 */
contract Adoption {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Fixed-size array storing adopter addresses for each pet
     * @dev Index corresponds to petId (0-15). address(0) means not adopted.
     */
    address[16] public adopters;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a pet is adopted
    event PetAdopted(uint256 indexed petId, address indexed adopter);

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the complete list of adopter addresses
     * @dev Returns fixed-size array of 16 addresses
     * @return Array of 16 addresses (address(0) if pet not adopted)
     */
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adopt a pet by its ID
     * @dev Pet IDs range from 0 to 15. Each pet can only be adopted once.
     * @param _petId The ID of the pet to adopt (0-15)
     * @return The adopted pet's ID
     *
     * Requirements:
     * - Pet ID must be between 0 and 15 (inclusive)
     * - Pet must not already be adopted (adopter address must be 0x0)
     */
    function adopt(uint _petId) public returns (uint) {
        require(_petId >= 0 && _petId <= 15, "Pet ID must be between 0 and 15");
        require(adopters[_petId] == address(0x0), "Pet already adopted");

        adopters[_petId] = msg.sender;

        return (_petId);
    }
}
