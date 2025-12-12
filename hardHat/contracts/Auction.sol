// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Auction
 * @author CertifiedBlockchain
 * @notice A secure auction contract with bidding and withdrawal functionality
 * @dev Implements a time-limited auction with reentrancy protection.
 *      Users can place cumulative bids, and losing bidders can withdraw
 *      their funds after the auction ends.
 *
 * Key Features:
 * - Time-limited auctions with configurable end time
 * - Cumulative bidding (users can increase their bids)
 * - Secure withdrawal pattern with reentrancy guard
 * - Owner can end auction and claim winning bid
 * - Event emission for transparency
 *
 * Security Features:
 * - Reentrancy guard on all withdrawal functions
 * - Owner-only administrative functions
 * - Checks-Effects-Interactions pattern
 *
 * Usage Example:
 * ```javascript
 * // Deploy auction
 * const auction = await Auction.deploy();
 *
 * // Owner sets end time (Unix timestamp)
 * await auction.putEndTime(Math.floor(Date.now()/1000) + 86400); // 24 hours
 *
 * // Users place bids
 * await auction.connect(bidder1).putBid({ value: ethers.parseEther("1.0") });
 * await auction.connect(bidder2).putBid({ value: ethers.parseEther("1.5") });
 *
 * // After auction ends, owner ends it officially
 * await auction.endAuction(true);
 *
 * // Losing bidders withdraw their funds
 * await auction.connect(bidder1).withdrawBid();
 *
 * // Owner withdraws the winning bid
 * await auction.withdrawWinningBid();
 * ```
 */
contract Auction {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping of bidder addresses to their total bid amounts
    mapping(address => uint) biddersData;

    /// @notice The current highest bid amount in wei
    uint highestBidAmount;

    /// @notice Address of the current highest bidder
    address highestBidder;

    /// @notice Unix timestamp when the auction started
    uint startTime = block.timestamp;

    /// @notice Unix timestamp when the auction ends
    uint endTime;

    /// @notice Address of the auction owner
    address owner;

    /// @notice Flag indicating if the auction has officially ended
    bool auctionEnded = false;

    /// @notice Reentrancy guard state variable
    bool private locked;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new bid is placed
    /// @param bidder Address of the bidder
    /// @param amount Amount added in this transaction
    /// @param totalBid Total cumulative bid for this bidder
    event BidPlaced(address indexed bidder, uint amount, uint totalBid);

    /// @notice Emitted when a bidder withdraws their funds
    /// @param bidder Address of the withdrawing bidder
    /// @param amount Amount withdrawn
    event BidWithdrawn(address indexed bidder, uint amount);

    /// @notice Emitted when the auction end time is set
    /// @param endTime The Unix timestamp when auction ends
    event AuctionEndTimeSet(uint endTime);

    /// @notice Emitted when the auction officially ends
    /// @param winner Address of the winning bidder
    /// @param winningBid The winning bid amount
    event AuctionEnded(address winner, uint winningBid);

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts function access to contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /// @notice Prevents reentrancy attacks
    modifier noReentrant() {
        require(!locked, "Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the auction contract
     * @dev Sets the deployer as the auction owner
     */
    constructor() {
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Places a bid in the auction
     * @dev Bids are cumulative - calling twice adds to previous bid
     *
     * Requirements:
     * - Auction must not be ended
     * - Current time must be before end time
     * - Bid amount must be greater than 0
     * - Cumulative bid must exceed current highest bid
     *
     * Emits a {BidPlaced} event
     */
    function putBid() public payable {
        uint calculateAmount = biddersData[msg.sender] + msg.value;
        require(auctionEnded == false, "Auction is Ended");
        require(block.timestamp <= endTime, "Auction is Ended");
        require(msg.value > 0, "Bid Amount Cannot Be Zero");
        require(
            calculateAmount > highestBidAmount,
            "Highest Bid Already Present"
        );

        biddersData[msg.sender] = calculateAmount;
        highestBidAmount = calculateAmount;
        highestBidder = msg.sender;

        emit BidPlaced(msg.sender, msg.value, calculateAmount);
    }

    /**
     * @notice Withdraws a losing bidder's funds after auction ends
     * @dev Uses reentrancy protection and checks-effects-interactions pattern
     *
     * Requirements:
     * - Auction must be ended
     * - Caller must not be the highest bidder (winner cannot withdraw)
     * - Caller must have funds to withdraw
     *
     * Emits a {BidWithdrawn} event
     */
    function withdrawBid() public noReentrant {
        require(auctionEnded == true, "Auction must be ended to withdraw");
        require(msg.sender != highestBidder, "Winner cannot withdraw bid");

        uint amount = biddersData[msg.sender];
        require(amount > 0, "No bid to withdraw");

        // Clear balance BEFORE transfer (prevents reentrancy)
        biddersData[msg.sender] = 0;

        // Transfer funds
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");

        emit BidWithdrawn(msg.sender, amount);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the auction owner's address
     * @return The owner address
     */
    function getOwnerAddress() public view returns (address) {
        return owner;
    }

    /**
     * @notice Returns the auction end time
     * @return Unix timestamp when auction ends
     */
    function getEndTime() public view returns (uint) {
        return endTime;
    }

    /**
     * @notice Returns whether the auction has ended
     * @return True if auction is ended, false otherwise
     */
    function getAuctionEnded() public view returns (bool) {
        return auctionEnded;
    }

    /**
     * @notice Returns the total bid amount for a specific address
     * @param _address The bidder's address to query
     * @return The total bid amount in wei
     */
    function getBidderBid(address _address) public view returns (uint) {
        return biddersData[_address];
    }

    /**
     * @notice Returns the current highest bid amount
     * @return The highest bid in wei
     */
    function HighestBid() public view returns (uint) {
        return highestBidAmount;
    }

    /**
     * @notice Returns the address of the current highest bidder
     * @return The highest bidder's address
     */
    function HighestBidder() public view returns (address) {
        return highestBidder;
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets the auction end time (owner only)
     * @dev End time must be in the future
     * @param _endTime Unix timestamp when auction should end
     *
     * Requirements:
     * - Caller must be owner
     * - End time must be greater than current block timestamp
     *
     * Emits an {AuctionEndTimeSet} event
     */
    function putEndTime(uint _endTime) public onlyOwner {
        require(_endTime > block.timestamp, "End time must be in the future");
        endTime = _endTime;
        emit AuctionEndTimeSet(_endTime);
    }

    /**
     * @notice Ends or reopens the auction (owner only)
     * @param _trueFalse True to end auction, false to reopen
     *
     * Emits an {AuctionEnded} event when ending
     */
    function endAuction(bool _trueFalse) public onlyOwner {
        auctionEnded = _trueFalse;
        if (_trueFalse) {
            emit AuctionEnded(highestBidder, highestBidAmount);
        }
    }

    /**
     * @notice Withdraws the winning bid to the owner (owner only)
     * @dev Uses reentrancy protection
     *
     * Requirements:
     * - Auction must be ended
     * - There must be a winning bid
     * - Winning bid must not already be withdrawn
     */
    function withdrawWinningBid() public onlyOwner noReentrant {
        require(auctionEnded == true, "Auction must be ended");
        require(highestBidAmount > 0, "No winning bid");

        uint amount = biddersData[highestBidder];
        require(amount > 0, "Already withdrawn");

        // Clear the winner's bid
        biddersData[highestBidder] = 0;

        // Transfer to owner
        (bool success, ) = payable(owner).call{value: amount}("");
        require(success, "Transfer failed");
    }
}
