// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract GuessingGame {
    /* Our Online gaming contract */
    address public owner;
    bool public online;
    bool private locked; // Reentrancy guard
    uint256 public maxBetAmount; // Maximum bet to prevent drain
    uint256 private nonce; // For improved randomness

    struct Player {
        uint wins;
        uint losses;
    }

    mapping(address => Player) public players;

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

    constructor() payable {
        owner = msg.sender;
        online = true;
        maxBetAmount = 0.1 ether; // Default max bet
        nonce = 0;
    }

    event PlayerWon(
        address player,
        uint amount,
        uint mysteryNumber,
        uint displayedNumber
    );
    event PlayerLost(
        address player,
        uint amount,
        uint mysteryNumber,
        uint displayedNumber
    );
    event GameStatusChanged(bool online);
    event MaxBetChanged(uint256 newMaxBet);

    // Improved randomness using multiple sources
    // Note: For production, use Chainlink VRF or similar oracle
    function mysteryNumber() internal returns (uint) {
        nonce++;
        uint randomNumber = (uint(keccak256(abi.encodePacked(
            blockhash(block.number - 1),
            block.timestamp,
            msg.sender,
            nonce,
            address(this).balance
        ))) % 10) + 1;
        return randomNumber;
    }

    function determineWinner(
        uint _number,
        uint _display,
        bool _guess
    ) public pure returns (bool) {
        if (_guess == true && _number > _display) {
            return true;
        } else if (_guess == true && _number < _display) {
            return false;
        } else if (_guess == false && _number > _display) {
            return false;
        } else if (_guess == false && _number < _display) {
            return true;
        }
        return false;
    }

    function winOrLose(
        uint _display,
        bool _guess
    ) external payable noReentrant returns (bool, uint) {
        /* Use true for a higher guess, false for a lower guess */
        require(online == true, "The game is not online");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(msg.value <= maxBetAmount, "Bet exceeds maximum allowed");

        // Ensure contract can pay out if player wins
        require(address(this).balance >= msg.value * 2, "Contract has insufficient funds for payout");

        uint _mysteryNumber = mysteryNumber();
        bool isWinner = determineWinner(_mysteryNumber, _display, _guess);

        /* Player Won */
        if (isWinner == true) {
            players[msg.sender].wins += 1;
            uint256 payout = msg.value * 2;

            // Use call instead of transfer for better gas handling
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");

            emit PlayerWon(msg.sender, msg.value, _mysteryNumber, _display);
            return (true, _mysteryNumber);
        /* Player Lost */
        } else {
            players[msg.sender].losses += 1;
            emit PlayerLost(msg.sender, msg.value, _mysteryNumber, _display);
            return (false, _mysteryNumber);
        }
    }

    function withdrawBet() public onlyOwner noReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
    }

    // Owner can set game online/offline
    function setOnline(bool _online) public onlyOwner {
        online = _online;
        emit GameStatusChanged(_online);
    }

    // Owner can adjust max bet
    function setMaxBet(uint256 _maxBet) public onlyOwner {
        require(_maxBet > 0, "Max bet must be greater than 0");
        maxBetAmount = _maxBet;
        emit MaxBetChanged(_maxBet);
    }

    // Get contract balance
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // Allow contract to receive ETH
    receive() external payable {}
}
