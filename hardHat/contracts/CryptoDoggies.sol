// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title CryptoDoggies
 * @notice NFT marketplace for collectible doggies with auto-pricing
 * @dev Optimized version with security improvements from Slither analysis
 */

contract AccessControl {
    address payable public owner;
    bool public paused;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    constructor() {
        owner = payable(msg.sender);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Contract paused");
        _;
    }

    modifier whenPaused() {
        require(paused, "Contract not paused");
        _;
    }

    function setOwner(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        address previousOwner = owner;
        owner = payable(newOwner);
        emit OwnershipTransferred(previousOwner, newOwner);
    }

    function pause() external onlyOwner whenNotPaused {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner whenPaused {
        paused = false;
        emit Unpaused(msg.sender);
    }
}

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

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}

contract CryptoDoggies is AccessControl, IERC721Metadata {
    // Events
    event TokenCreated(uint256 indexed tokenId, string name, bytes5 dna, uint256 price, address indexed tokenOwner);
    event TokenSold(
        uint256 indexed tokenId,
        string name,
        bytes5 dna,
        uint256 sellingPrice,
        uint256 newPrice,
        address indexed oldOwner,
        address indexed newOwner
    );

    // Structs
    struct Doggy {
        string name;
        bytes5 dna;
    }

    // State variables
    mapping(uint256 => address) private _tokenOwners;
    mapping(uint256 => uint256) private _tokenPrices;
    mapping(address => uint256) private _ownerTokenCount;
    mapping(uint256 => address) private _tokenApprovals;

    Doggy[] private _doggies;
    bool private _erc721Enabled;

    // Constants (gas optimization - Slither recommendation)
    uint256 private constant STARTING_PRICE = 0.01 ether;
    uint256 private constant INCREASE_LIMIT_1 = 0.02 ether;
    uint256 private constant INCREASE_LIMIT_2 = 0.5 ether;
    uint256 private constant INCREASE_LIMIT_3 = 2.0 ether;
    uint256 private constant INCREASE_LIMIT_4 = 5.0 ether;
    uint256 private constant PLATFORM_FEE_PERCENT = 6;

    // Modifiers
    modifier onlyERC721() {
        require(_erc721Enabled, "ERC721 not enabled");
        _;
    }

    modifier validToken(uint256 tokenId) {
        require(tokenId < _doggies.length, "Invalid token");
        _;
    }

    // Admin functions
    function createToken(string calldata tokenName, address tokenOwner, uint256 price) external onlyOwner {
        require(tokenOwner != address(0), "Invalid owner");
        require(price >= STARTING_PRICE, "Price too low");
        _createToken(tokenName, tokenOwner, price);
    }

    function createToken(string calldata tokenName) external onlyOwner {
        _createToken(tokenName, address(this), STARTING_PRICE);
    }

    function enableERC721() external onlyOwner {
        _erc721Enabled = true;
    }

    function withdrawBalance(address payable to, uint256 amount) external onlyOwner {
        uint256 balance = address(this).balance;
        require(amount <= balance, "Insufficient balance");

        uint256 withdrawAmount = amount == 0 ? balance : amount;
        address payable recipient = to == address(0) ? owner : to;

        (bool success, ) = recipient.call{value: withdrawAmount}("");
        require(success, "Transfer failed");
    }

    // Internal functions
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

    function _generateRandomDna() private view returns (bytes5) {
        bytes32 hashVal = blockhash(block.number - 1);
        return bytes5(hashVal << 216);
    }

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

    function _isContract(address addr) private view returns (bool) {
        uint256 size;
        assembly { size := extcodesize(addr) }
        return size > 0;
    }

    function _owns(address claimant, uint256 tokenId) private view returns (bool) {
        return _tokenOwners[tokenId] == claimant;
    }

    function _approved(address spender, uint256 tokenId) private view returns (bool) {
        return _tokenApprovals[tokenId] == spender;
    }

    // Public functions
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

        // Refund excess
        if (excess > 0) {
            (bool refundSuccess, ) = payable(newOwner).call{value: excess}("");
            require(refundSuccess, "Refund failed");
        }
    }

    // View functions
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

    function priceOf(uint256 tokenId) public view validToken(tokenId) returns (uint256) {
        return _tokenPrices[tokenId];
    }

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

    // ERC721 Implementation
    function totalSupply() external view override returns (uint256) {
        return _doggies.length;
    }

    function balanceOf(address tokenOwner) external view override returns (uint256) {
        require(tokenOwner != address(0), "Invalid address");
        return _ownerTokenCount[tokenOwner];
    }

    function ownerOf(uint256 tokenId) external view override validToken(tokenId) returns (address) {
        return _tokenOwners[tokenId];
    }

    function approve(address to, uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(_owns(msg.sender, tokenId), "Not owner");
        _tokenApprovals[tokenId] = to;
        emit Approval(msg.sender, to, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(to != address(0), "Invalid recipient");
        require(_owns(from, tokenId), "Not owner");
        require(_approved(msg.sender, tokenId) || msg.sender == from, "Not approved");
        _transfer(from, to, tokenId);
    }

    function transfer(address to, uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(to != address(0), "Invalid recipient");
        require(_owns(msg.sender, tokenId), "Not owner");
        _transfer(msg.sender, to, tokenId);
    }

    function implementsERC721() external view override returns (bool) {
        return _erc721Enabled;
    }

    function takeOwnership(uint256 tokenId) external override whenNotPaused onlyERC721 validToken(tokenId) {
        require(_approved(msg.sender, tokenId), "Not approved");
        _transfer(_tokenOwners[tokenId], msg.sender, tokenId);
    }

    function name() external pure override returns (string memory) {
        return "CryptoDoggies";
    }

    function symbol() external pure override returns (string memory) {
        return "CDT";
    }

    // Fallback to receive ETH
    receive() external payable {}
}
