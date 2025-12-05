// SPDX-License-Identifier: MIT
pragma solidity 0.8.28; // Fixed pragma, latest stable version

import "./DappToken.sol";

/**
 * @title DappTokenSale
 * @author Your Name/Organization
 * @notice A token sale contract for selling DappTokens
 * @dev Implements a simple token sale mechanism with onlyAdmin access control
 */
contract DappTokenSale {
    // State variables with visibility
    address private immutable admin;
    DappToken public immutable tokenContract;
    uint256 public immutable tokenPrice;
    uint256 public tokensSold = 1; // Initialize to 1 to avoid zero-to-one write (subtract 1 when reading)

    // Events
    event Sell(address indexed _buyer, uint256 _amount);
    event SaleEnded(address indexed _admin, uint256 _tokensReturned, uint256 _ethReturned);

    // Custom errors (more gas efficient than require strings)
    error OnlyAdmin();
    error IncorrectETHAmount();
    error NotEnoughTokens();
    error TransferFailed();
    error ZeroTokensPurchase();
    error ZeroPrice();

    // Modifier for access control
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    /**
     * @notice Initializes the token sale contract
     * @dev Sets admin, token contract, and price. Price must be > 0
     * @param _tokenContract The DappToken contract address
     * @param _tokenPrice Price per whole token in wei
     */
    constructor(DappToken _tokenContract, uint256 _tokenPrice) payable {
        if (_tokenPrice == 0) revert ZeroPrice(); // != 0 is cheaper than > 0
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    /**
     * @notice Purchase tokens from the sale
     * @dev Converts whole tokens to smallest unit based on decimals
     * @param _numberOfTokens Number of whole tokens to purchase
     */
    function buyTokens(uint256 _numberOfTokens) external payable {
        // Zero value check
        if (_numberOfTokens == 0) revert ZeroTokensPurchase();

        // Cache storage/computed values
        uint256 cachedTokenPrice = tokenPrice;
        DappToken cachedTokenContract = tokenContract;
        
        uint256 tokenAmount = _numberOfTokens * (10 ** cachedTokenContract.decimals());
        uint256 cost = _numberOfTokens * cachedTokenPrice;

        // Checks
        if (msg.value != cost) revert IncorrectETHAmount();
        if (cachedTokenContract.balanceOf(address(this)) < tokenAmount) revert NotEnoughTokens(); // < instead of >=

        // Effects (update state BEFORE external call - prevents reentrancy)
        tokensSold = tokensSold + _numberOfTokens; // + instead of +=

        // Emit event BEFORE external call (prevents event-based reentrancy)
        emit Sell(msg.sender, _numberOfTokens);

        // Interactions (external call last)
        if (!cachedTokenContract.transfer(msg.sender, tokenAmount)) revert TransferFailed();
    }

    /**
     * @notice Ends the token sale and returns remaining tokens/ETH to admin
     * @dev Only callable by admin. Transfers all remaining tokens and ETH
     */
    function endSale() external onlyAdmin {
        DappToken cachedTokenContract = tokenContract;
        address cachedAdmin = admin;
        
        uint256 remainingTokens = cachedTokenContract.balanceOf(address(this));
        uint256 remainingBalance;
        
        // Use assembly for selfbalance() - more gas efficient
        assembly {
            remainingBalance := selfbalance()
        }

        // Emit event before external calls
        emit SaleEnded(cachedAdmin, remainingTokens, remainingBalance);

        // Transfer remaining tokens
        if (remainingTokens != 0) {
            if (!cachedTokenContract.transfer(cachedAdmin, remainingTokens)) revert TransferFailed();
        }

        // Transfer remaining ETH using call instead of transfer
        if (remainingBalance != 0) {
            (bool success, ) = payable(cachedAdmin).call{value: remainingBalance}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @notice Returns the actual number of tokens sold
     * @dev Subtracts 1 because tokensSold is initialized to 1
     * @return The number of whole tokens sold
     */
    function getTokensSold() external view returns (uint256) {
        return tokensSold - 1;
    }

    /**
     * @notice Returns the admin address
     * @return The admin address
     */
    function getAdmin() external view returns (address) {
        return admin;
    }
}