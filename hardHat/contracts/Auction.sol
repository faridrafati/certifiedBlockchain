// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Auction {
    mapping(address => uint) biddersData;
    uint highestBidAmount;
    address highestBidder;
    uint startTime = block.timestamp;
    uint endTime;
    address owner;
    bool auctionEnded = false;
    bool private locked; // Reentrancy guard

    // Events for transparency
    event BidPlaced(address indexed bidder, uint amount, uint totalBid);
    event BidWithdrawn(address indexed bidder, uint amount);
    event AuctionEndTimeSet(uint endTime);
    event AuctionEnded(address winner, uint winningBid);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier noReentrant() {
        require(!locked, "Reentrant call detected");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
    }

    // put new bid
    function putBid() public payable {
        //verify value is not zero
        uint calculateAmount = biddersData[msg.sender] + msg.value;
        // check session not ended
        require(auctionEnded == false, "Auction is Ended");
        require(block.timestamp <= endTime, "Auction is Ended");
        require(msg.value > 0, "Bid Amount Cannot Be Zero");

        //check Highest Bid
        require(
            calculateAmount > highestBidAmount,
            "Highest Bid Already Present"
        );
        biddersData[msg.sender] = calculateAmount;
        highestBidAmount = calculateAmount;
        highestBidder = msg.sender;

        emit BidPlaced(msg.sender, msg.value, calculateAmount);
    }

    function getOwnerAddress() public view returns (address) {
        return owner;
    }

    function getEndTime() public view returns (uint) {
        return endTime;
    }

    function getAuctionEnded() public view returns (bool) {
        return auctionEnded;
    }

    // get Contract Balance (Only for testing)
    function getBidderBid(address _address) public view returns (uint) {
        return biddersData[_address];
    }
    // get Highest BidAmount
    function HighestBid() public view returns (uint) {
        return highestBidAmount;
    }

    // get Highest Bidder Address
    function HighestBidder() public view returns (address) {
        return highestBidder;
    }

    // put endTime - now with require instead of if
    function putEndTime(uint _endTime) public onlyOwner {
        require(_endTime > block.timestamp, "End time must be in the future");
        endTime = _endTime;
        emit AuctionEndTimeSet(_endTime);
    }

    // end auction - now with require instead of if
    function endAuction(bool _trueFalse) public onlyOwner {
        auctionEnded = _trueFalse;
        if (_trueFalse) {
            emit AuctionEnded(highestBidder, highestBidAmount);
        }
    }

    // withdraw Bid - FIXED: Only owner of bid can withdraw, with reentrancy protection
    function withdrawBid() public noReentrant {
        // Only allow withdrawal if auction has ended
        require(auctionEnded == true, "Auction must be ended to withdraw");

        // Highest bidder cannot withdraw (they won the auction)
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

    // Owner can withdraw the winning bid after auction ends
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
