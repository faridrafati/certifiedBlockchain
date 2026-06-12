// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ForgeTypes
 * @author CertifiedBlockchain
 * @notice Shared types, feature-bit constants, and errors for the TokenForge suite.
 * @dev Feature ids double as bit positions in the uint256 feature bitmap, so
 *      `bitmap & (1 << id)` tests a feature and `featurePrice[id]` prices it.
 */

library Features {
    // ids 1..23 mirror the public price chart; 0 is reserved.
    uint8 internal constant ID_REMOVE_CREDITS = 1;
    uint8 internal constant ID_CUSTOM_DECIMALS = 2;
    uint8 internal constant ID_SUPPLY_CAPPED = 3;
    uint8 internal constant ID_SUPPLY_UNLIMITED = 4;
    uint8 internal constant ID_ACCESS_OWNABLE = 5;
    uint8 internal constant ID_ACCESS_ROLES = 6;
    uint8 internal constant ID_PAUSABLE = 7;
    uint8 internal constant ID_BURNABLE = 8;
    uint8 internal constant ID_MINTABLE = 9;
    uint8 internal constant ID_BATCH_OPS = 10;
    uint8 internal constant ID_WHITELIST = 11;
    uint8 internal constant ID_BLACKLIST = 12;
    uint8 internal constant ID_CONTROLLED = 13;
    uint8 internal constant ID_REFLECTION = 14;
    uint8 internal constant ID_TAXABLE = 15;
    uint8 internal constant ID_ANTI_WHALE = 16;
    uint8 internal constant ID_LP_SETUP = 17;
    uint8 internal constant ID_DEFLATIONARY = 18;
    uint8 internal constant ID_CALLBACK = 19;
    uint8 internal constant ID_PERMIT = 20;
    uint8 internal constant ID_AUTH_3009 = 21;
    uint8 internal constant ID_URWA = 22;
    uint8 internal constant ID_TOKEN_RECOVER = 23;

    uint8 internal constant MAX_FEATURE_ID = 23;

    uint256 internal constant REMOVE_CREDITS = 1 << 1;
    uint256 internal constant CUSTOM_DECIMALS = 1 << 2;
    uint256 internal constant SUPPLY_CAPPED = 1 << 3;
    uint256 internal constant SUPPLY_UNLIMITED = 1 << 4;
    uint256 internal constant ACCESS_OWNABLE = 1 << 5;
    uint256 internal constant ACCESS_ROLES = 1 << 6;
    uint256 internal constant PAUSABLE = 1 << 7;
    uint256 internal constant BURNABLE = 1 << 8;
    uint256 internal constant MINTABLE = 1 << 9;
    uint256 internal constant BATCH_OPS = 1 << 10;
    uint256 internal constant WHITELIST = 1 << 11;
    uint256 internal constant BLACKLIST = 1 << 12;
    uint256 internal constant CONTROLLED = 1 << 13;
    uint256 internal constant REFLECTION = 1 << 14;
    uint256 internal constant TAXABLE = 1 << 15;
    uint256 internal constant ANTI_WHALE = 1 << 16;
    uint256 internal constant LP_SETUP = 1 << 17;
    uint256 internal constant DEFLATIONARY = 1 << 18;
    uint256 internal constant CALLBACK = 1 << 19;
    uint256 internal constant PERMIT = 1 << 20;
    uint256 internal constant AUTH_3009 = 1 << 21;
    uint256 internal constant URWA = 1 << 22;
    uint256 internal constant TOKEN_RECOVER = 1 << 23;

    /// @dev Any feature whose admin surface requires an access manager.
    uint256 internal constant NEEDS_ACCESS =
        SUPPLY_CAPPED | SUPPLY_UNLIMITED | PAUSABLE | MINTABLE | WHITELIST |
        BLACKLIST | CONTROLLED | TAXABLE | ANTI_WHALE | DEFLATIONARY |
        TOKEN_RECOVER | URWA;

    /// @dev Features the reflection family supports (besides REFLECTION itself).
    uint256 internal constant REFLECTION_ALLOWED =
        REFLECTION | REMOVE_CREDITS | CUSTOM_DECIMALS | ACCESS_OWNABLE |
        ACCESS_ROLES | BURNABLE | BLACKLIST | ANTI_WHALE | PERMIT |
        TOKEN_RECOVER | LP_SETUP;

    /// @dev Features the RWA family supports (besides URWA itself).
    uint256 internal constant URWA_ALLOWED =
        URWA | REMOVE_CREDITS | CUSTOM_DECIMALS | SUPPLY_CAPPED |
        SUPPLY_UNLIMITED | ACCESS_ROLES | PAUSABLE | BURNABLE | MINTABLE |
        BATCH_OPS | WHITELIST | CONTROLLED | PERMIT | AUTH_3009 | TOKEN_RECOVER;

    function has(uint256 bitmap, uint256 flag) internal pure returns (bool) {
        return bitmap & flag != 0;
    }
}

/**
 * @notice Full constructor configuration for a generated token.
 * @dev All percentage-like values are in basis points (1% = 100 bps).
 *      `initialSupply` / `maxSupply` are raw token units (already scaled by decimals).
 */
struct TokenConfig {
    string name;
    string symbol;
    uint8 decimals_;        // used only when CUSTOM_DECIMALS, else 18
    uint256 initialSupply;
    uint256 maxSupply;      // used only when SUPPLY_CAPPED
    uint256 featureBitmap;
    address owner_;         // creator; receives supply + admin powers
    uint16 buyTaxBps;       // TAXABLE
    uint16 sellTaxBps;      // TAXABLE
    uint16 transferTaxBps;  // TAXABLE
    address taxWallet;      // TAXABLE
    uint16 burnBps;         // DEFLATIONARY
    uint16 maxTxBps;        // ANTI_WHALE (of total supply)
    uint16 maxWalletBps;    // ANTI_WHALE (of total supply)
    uint16 reflectionFeeBps; // REFLECTION
}

/// @notice Liquidity-pool setup parameters (LP_SETUP feature).
struct LPConfig {
    uint256 tokenAmount;   // raw token units added to the pool
    uint256 nativeAmount;  // wei sent on top of the service fee
}

// ---------------------------------------------------------------------------
// Shared errors (small bytecode footprint, used across the suite)
// ---------------------------------------------------------------------------
error FeatureDisabled();
error NoAccessManager();
error Blacklisted(address account);
error NotWhitelisted(address account);
error ZeroAddress();
error LengthMismatch();
error FeeTooHigh();
error LimitTooLow();
error CapExceeded();
error InvalidConfig(string reason);
error InsufficientFee(uint256 required, uint256 provided);
error AuthorizationInvalid();
error FrozenBalance(address account, uint256 available);
