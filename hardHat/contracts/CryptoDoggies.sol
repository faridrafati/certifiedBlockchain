// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AccessControl
 * @author CertifiedBlockchain
 * @notice Base contract providing ownership and pause functionality
 * @dev Used as a parent contract for CryptoDoggies to provide admin controls
 *
 * Features:
 * - Ownership management with transfer capability
 * - Emergency pause/unpause functionality
 * - Event emission for transparency
 */
contract AccessControl {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the contract owner (payable for receiving funds)
    address payable public owner;

    /// @notice Flag indicating if contract is paused
    bool public paused;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when ownership is transferred
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /// @notice Emitted when contract is paused
    event Paused(address account);

    /// @notice Emitted when contract is unpaused
    event Unpaused(address account);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() {
        owner = payable(msg.sender);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts function to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    /// @notice Requires contract to not be paused
    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    /// @notice Requires contract to be paused
    modifier whenPaused() {
        require(paused, "Contract not paused");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Transfers ownership to a new address
     * @param newOwner The new owner's address
     */
    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address previousOwner = owner;
        owner = payable(newOwner);
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    /**
     * @notice Pauses the contract (emergency stop)
     */
    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpauses the contract
     */
    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }
}

/**
 * @title IERC721
 * @notice Interface for ERC721 non-fungible token standard
 */
interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    function totalSupply() external view returns (uint256);
    function balanceOf(address tokenOwner) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
    function approve(address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function transfer(address to, uint256 tokenId) external;
    function implementsERC721() external view returns (bool);
    function takeOwnership(uint256 tokenId) external;
}

/**
 * @title IERC721Metadata
 * @notice Interface extending ERC721 with name and symbol
 */
interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}

/**
 * @title CryptoDoggies
 * @author CertifiedBlockchain
 * @notice NFT marketplace for collectible doggies with automatic price increases
 * @dev Implements ERC721 with a unique auto-pricing mechanism. When a doggy is
 *      purchased, its price automatically increases based on price tiers.
 *
 * Key Features:
 * - ERC721 NFT standard implementation
 * - Auto-pricing: prices increase after each sale
 * - Unique DNA generation for each doggy
 * - Platform fee (6%) on sales
 * - Pausable for emergency stops
 * - Owner-only token creation
 *
 * Price Increase Tiers:
 * - < 0.02 ETH: ~110% increase
 * - < 0.5 ETH:  ~40% increase
 * - < 2.0 ETH:  ~29% increase
 * - < 5.0 ETH:  ~21% increase
 * - >= 5.0 ETH: ~17% increase
 *
 * Security Features:
 * - Optimized with Slither analysis recommendations
 * - Contracts cannot purchase (prevents certain attacks)
 * - Pausable functionality
 * - Safe transfer patterns
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const doggies = await CryptoDoggies.deploy();
 *
 * // Owner creates a new doggy
 * await doggies.createToken("Buddy");
 *
 * // Or with custom owner and price
 * await doggies.createToken("Max", userAddress, ethers.parseEther("0.05"));
 *
 * // User purchases a doggy
 * const price = await doggies.priceOf(0);
 * await doggies.connect(buyer).purchase(0, { value: price });
 *
 * // Check token details
 * const [name, dna, price, nextPrice, owner] = await doggies.getToken(0);
 *
 * // Enable ERC721 transfers
 * await doggies.enableERC721();
 *
 * // Transfer NFT
 * await doggies.connect(owner).transfer(recipient, tokenId);
 * ```
 */
contract CryptoDoggies is AccessControl, IERC721Metadata {
    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new doggy token is created
    event TokenCreated(uint256 indexed tokenId, string name, bytes5 dna, uint256 price, address indexed tokenOwner);

    /// @notice Emitted when a doggy is sold
    event TokenSold(
        uint256 indexed tokenId,
        string name,
        bytes5 dna,
        uint256 sellingPrice,
        uint256 newPrice,
        address indexed oldOwner,
        address indexed newOwner
    );

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a unique Doggy NFT
     */
    struct Doggy {
        string name;    // Doggy's name
        bytes5 dna;     // Unique 5-byte DNA determining appearance
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping from token ID to owner address
    mapping(uint256 => address) private _tokenOwners;

    /// @notice Mapping from token ID to price in wei
    mapping(uint256 => uint256) private _tokenPrices;

    /// @notice Mapping from owner to token count
    mapping(address => uint256) private _ownerTokenCount;

    /// @notice Mapping from token ID to approved address
    mapping(uint256 => address) private _tokenApprovals;

    /// @notice Array of all Doggy NFTs
    Doggy[] private _doggies;

    /// @notice Flag to enable ERC721 transfer functions
    bool private _erc721Enabled;

    /*//////////////////////////////////////////////////////////////
                              CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Starting price for new doggies (0.01 ETH)
    uint256 private constant STARTING_PRICE = 0.01 ether;

    /// @notice Price tier 1 limit (0.02 ETH)
    uint256 private constant INCREASE_LIMIT_1 = 0.02 ether;

    /// @notice Price tier 2 limit (0.5 ETH)
    uint256 private constant INCREASE_LIMIT_2 = 0.5 ether;

    /// @notice Price tier 3 limit (2.0 ETH)
    uint256 private constant INCREASE_LIMIT_3 = 2.0 ether;

    /// @notice Price tier 4 limit (5.0 ETH)
    uint256 private constant INCREASE_LIMIT_4 = 5.0 ether;

    /// @notice Platform fee percentage (6%)
    uint256 private constant PLATFORM_FEE_PERCENT = 6;

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Requires ERC721 functionality to be enabled
    modifier onlyERC721() {
        require(_erc721Enabled, "ERC721 not enabled");
        _;
    }

    /// @notice Validates token ID exists
    modifier validToken(uint256 tokenId) {
        require(tokenId < _doggies.length, "Invalid token");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                         ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new doggy token with custom owner and price
     * @param tokenName Name for the doggy
     * @param tokenOwner Address to own the doggy
     * @param price Initial price in wei
     */
    function createToken(string calldata tokenName, address tokenOwner, uint256 price) external onlyOwner {
        require(tokenOwner != address(0), "Invalid owner");
        require(price >= STARTING_PRICE, "Price too low");
        _createToken(tokenName, tokenOwner, price);
    }

    /**
     * @notice Creates a new doggy token owned by contract at starting price
     * @param tokenName Name for the doggy
     */
    function createToken(string calldata tokenName) external onlyOwner {
        _createToken(tokenName, address(this), STARTING_PRICE);
    }

    /**
     * @notice Enables ERC721 transfer functionality
     * @dev Once enabled, cannot be disabled
     */
    function enableERC721() external onlyOwner {
        _erc721Enabled = true;
    }

    /**
     * @notice Withdraws contract balance to owner or specified address
     * @param to Recipient address (address(0) defaults to owner)
     * @param amount Amount to withdraw (0 for entire balance)
     */
    function withdrawBalance(address payable to, uint256 amount) external onlyOwner {
        uint256 balance = address(this).balance;
        require(amount <= balance, "Insufficient balance");

        uint256 withdrawAmount = amount == 0 ? balance : amount;
        address payable recipient = to == address(0) ? owner : to;

        (bool success, ) = recipient.call{value: withdrawAmount}("");
        require(success, "Transfer failed");
    }

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Internal function to create a new token
     */
    function _createToken(string calldata tokenName, address tokenOwner, uint256 price) private {
        bytes5 dna = _generateRandomDna();

        _doggies.push(Doggy({
            name: tokenName,
            dna: dna
        }));

        uint256 newTokenId = _doggies.length - 1;
        _tokenPrices[newTokenId] = price;

        emit TokenCreated(newTokenId, tokenName, dna, price, tokenOwner);
        _transfer(address(0), tokenOwner, newTokenId);
    }

    /**
     * @notice Generates pseudo-random DNA for a doggy
     * @return 5-byte DNA value
     */
    function _generateRandomDna() private view returns (bytes5) {
        bytes32 hashVal = blockhash(block.number - 1);
        return bytes5(hashVal << 216);
    }

    /**
     * @notice Internal transfer function
     */
    function _transfer(address from, address to, uint256 tokenId) private {
        if (to != address(0)) {
            _ownerTokenCount[to]++;
        }
        _tokenOwners[tokenId] = to;

        if (from != address(0)) {
            _ownerTokenCount[from]--;
            delete _tokenApprovals[tokenId];
        }

        emit Transfer(from, to, tokenId);
    }

    /**
     * @notice Checks if address is a contract
     */
    function _isContract(address addr) private view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }

    /**
     * @notice Checks if address owns token
     */
    function _owns(address claimant, uint256 tokenId) private view returns (bool) {
        return _tokenOwners[tokenId] == claimant;
    }

    /**
     * @notice Checks if address is approved for token
     */
    function _approved(address spender, uint256 tokenId) private view returns (bool) {
        return _tokenApprovals[tokenId] == spender;
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Purchase a doggy token
     * @dev Price automatically increases after purchase
     * @param tokenId ID of the doggy to purchase
     *
     * Requirements:
     * - Contract must not be paused
     * - Token must exist
     * - Buyer cannot be current owner
     * - Contracts cannot purchase
     * - Must send sufficient ETH
     */
    function purchase(uint256 tokenId) external payable whenNotPaused validToken(tokenId) {
        address oldOwner = _tokenOwners[tokenId];
        address newOwner = msg.sender;
        uint256 sellingPrice = _tokenPrices[tokenId];

        require(oldOwner != address(0), "Token not owned");
        require(newOwner != address(0), "Invalid buyer");
        require(oldOwner != newOwner, "Already owner");
        require(!_isContract(newOwner), "Contracts cannot buy");
        require(sellingPrice > 0, "Not for sale");
        require(msg.value >= sellingPrice, "Insufficient payment");

        _transfer(oldOwner, newOwner, tokenId);

        uint256 newPrice = nextPriceOf(tokenId);
        _tokenPrices[tokenId] = newPrice;

        emit TokenSold(
            tokenId,
            _doggies[tokenId].name,
            _doggies[tokenId].dna,
            sellingPrice,
            newPrice,
            oldOwner,
            newOwner
        );

        uint256 excess = msg.value - sellingPrice;
        uint256 platformFee = (sellingPrice * PLATFORM_FEE_PERCENT) / 100;

        // Pay previous owner (if not contract)
        if (oldOwner != address(this)) {
            uint256 sellerProceeds = sellingPrice - platformFee;
            (bool success, ) = payable(oldOwner).call{value: sellerProceeds}("");
            require(success, "Seller payment failed");
        }

        // Refund excess payment
        if (excess > 0) {
            (bool refundSuccess, ) = payable(newOwner).call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns details for a specific doggy
     * @param tokenId The doggy's token ID
     * @return tokenName The doggy's name
     * @return dna The doggy's unique DNA
     * @return price Current price
     * @return nextPrice Price after next purchase
     * @return tokenOwner Current owner
     */
    function getToken(uint256 tokenId) external view validToken(tokenId) returns (
        string memory tokenName,
        bytes5 dna,
        uint256 price,
        uint256 nextPrice,
        address tokenOwner
    ) {
        Doggy storage doggy = _doggies[tokenId];
        return (
            doggy.name,
            doggy.dna,
            _tokenPrices[tokenId],
            nextPriceOf(tokenId),
            _tokenOwners[tokenId]
        );
    }

    /**
     * @notice Returns all doggies in the marketplace
     * @return names Array of all doggy names
     * @return dnas Array of all doggy DNAs
     * @return prices Array of current prices
     * @return nextPrices Array of next prices
     * @return owners Array of current owners
     */
    function getAllTokens() external view returns (
        string[] memory names,
        bytes5[] memory dnas,
        uint256[] memory prices,
        uint256[] memory nextPrices,
        address[] memory owners
    ) {
        uint256 total = _doggies.length;
        names = new string[](total);
        dnas = new bytes5[](total);
        prices = new uint256[](total);
        nextPrices = new uint256[](total);
        owners = new address[](total);

        for (uint256 i = 0; i < total; i++) {
            names[i] = _doggies[i].name;
            dnas[i] = _doggies[i].dna;
            prices[i] = _tokenPrices[i];
            nextPrices[i] = nextPriceOf(i);
            owners[i] = _tokenOwners[i];
        }
    }

    /**
     * @notice Returns all token IDs owned by an address
     * @param tokenOwner The owner's address
     * @return Array of token IDs
     */
    function tokensOf(address tokenOwner) external view returns (uint256[] memory) {
        uint256 tokenCount = _ownerTokenCount[tokenOwner];
        if (tokenCount == 0) {
            return new uint256[](0);
        }

        uint256[] memory result = new uint256[](tokenCount);
        uint256 total = _doggies.length;
        uint256 resultIndex = 0;

        for (uint256 i = 0; i < total && resultIndex < tokenCount; i++) {
            if (_tokenOwners[i] == tokenOwner) {
                result[resultIndex++] = i;
            }
        }
        return result;
    }

    /**
     * @notice Returns current price of a doggy
     * @param tokenId The doggy's token ID
     * @return Price in wei
     */
    function priceOf(uint256 tokenId) public view validToken(tokenId) returns (uint256) {
        return _tokenPrices[tokenId];
    }

    /**
     * @notice Calculates the price after next purchase
     * @dev Price increase depends on current price tier
     * @param tokenId The doggy's token ID
     * @return Next price in wei
     */
    function nextPriceOf(uint256 tokenId) public view validToken(tokenId) returns (uint256) {
        uint256 price = _tokenPrices[tokenId];

        if (price < INCREASE_LIMIT_1) {
            return (price * 200) / 95;  // ~110% increase
        } else if (price < INCREASE_LIMIT_2) {
            return (price * 135) / 96;  // ~40% increase
        } else if (price < INCREASE_LIMIT_3) {
            return (price * 125) / 97;  // ~29% increase
        } else if (price < INCREASE_LIMIT_4) {
            return (price * 117) / 97;  // ~21% increase
        } else {
            return (price * 115) / 98;  // ~17% increase
        }
    }

    /*//////////////////////////////////////////////////////////////
                      ERC721 IMPLEMENTATION
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns total number of doggies
     */
    function totalSupply() external view override returns (uint256) {
        return _doggies.length;
    }

    /**
     * @notice Returns number of doggies owned by an address
     */
    function balanceOf(address tokenOwner) external view override returns (uint256) {
        require(tokenOwner != address(0), "Invalid address");
        return _ownerTokenCount[tokenOwner];
    }

    /**
     * @notice Returns owner of a specific doggy
     */
    function ownerOf(uint256 tokenId) external view override validToken(tokenId) returns (address) {
        return _tokenOwners[tokenId];
    }

    /**
     * @notice Approves another address to transfer a token
     */
    function approve(address to, uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(_owns(msg.sender, tokenId), "Not owner");
        _tokenApprovals[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    /**
     * @notice Transfers token from one address to another
     */
    function transferFrom(address from, address to, uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(to != address(0), "Invalid recipient");
        require(_owns(from, tokenId), "Not owner");
        require(_approved(msg.sender, tokenId) || msg.sender == from, "Not approved");
        _transfer(from, to, tokenId);
    }

    /**
     * @notice Transfers token from caller to another address
     */
    function transfer(address to, uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(to != address(0), "Invalid recipient");
        require(_owns(msg.sender, tokenId), "Not owner");
        _transfer(msg.sender, to, tokenId);
    }

    /**
     * @notice Returns whether ERC721 is enabled
     */
    function implementsERC721() external view override returns (bool) {
        return _erc721Enabled;
    }

    /**
     * @notice Takes ownership of approved token
     */
    function takeOwnership(uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(_approved(msg.sender, tokenId), "Not approved");
        _transfer(_tokenOwners[tokenId], msg.sender, tokenId);
    }

    /**
     * @notice Returns the collection name
     */
    function name() external pure override returns (string memory) {
        return "CryptoDoggies";
    }

    /**
     * @notice Returns the collection symbol
     */
    function symbol() external pure override returns (string memory) {
        return "CDT";
    }

    /*//////////////////////////////////////////////////////////////
                          RECEIVE FUNCTION
    //////////////////////////////////////////////////////////////*/

    /// @notice Allows contract to receive ETH directly
    receive() external payable {}
}
