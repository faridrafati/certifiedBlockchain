// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GuessingGame
 * @author CertifiedBlockchain
 * @notice A blockchain-based number guessing game with ETH betting
 * @dev Players bet on whether a mystery number (1-10) is higher or lower
 *      than a displayed number. Winners receive 2x their bet.
 *
 * Key Features:
 * - Simple higher/lower guessing mechanics
 * - 2x payout for winners
 * - Configurable maximum bet amount
 * - Owner can toggle game online/offline
 * - Player statistics tracking (wins/losses)
 *
 * Security Features:
 * - Reentrancy guard on betting function
 * - Maximum bet limit to prevent contract drainage
 * - Balance check before allowing bets
 * - Owner-only administrative functions
 *
 * How It Works:
 * 1. Contract generates a mystery number (1-10)
 * 2. Player sees a displayed number and guesses higher or lower
 * 3. If correct, player wins 2x their bet
 * 4. If incorrect, contract keeps the bet
 *
 * Usage Example:
 * ```javascript
 * // Deploy with some initial ETH
 * const game = await GuessingGame.deploy({ value: ethers.parseEther("1.0") });
 *
 * // Player makes a bet - guess higher than 5
 * await game.connect(player).winOrLose(5, true, { value: ethers.parseEther("0.05") });
 *
 * // Check player stats
 * const stats = await game.players(player.address);
 * console.log(`Wins: ${stats.wins}, Losses: ${stats.losses}`);
 *
 * // Owner adjusts max bet
 * await game.setMaxBet(ethers.parseEther("0.2"));
 * ```
 *
 * @custom:warning Randomness in this contract is pseudo-random and not suitable
 *                 for high-stakes applications. For production use, integrate
 *                 Chainlink VRF or similar oracle for verifiable randomness.
 */
contract GuessingGame {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the contract owner
    address public owner;

    /// @notice Flag indicating if the game is currently accepting bets
    bool public online;

    /// @notice Reentrancy guard state variable
    bool private locked;

    /// @notice Maximum allowed bet amount in wei
    uint256 public maxBetAmount;

    /// @notice Nonce for improved randomness entropy
    uint256 private nonce;

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure tracking a player's game statistics
     */
    struct Player {
        uint wins;    // Number of games won
        uint losses;  // Number of games lost
    }

    /*//////////////////////////////////////////////////////////////
                              MAPPINGS
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping of player addresses to their statistics
    mapping(address => Player) public players;

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
     * @notice Deploys the guessing game contract
     * @dev Contract should be deployed with ETH to fund initial payouts
     */
    constructor() payable {
        owner = msg.sender;
        online = true;
        maxBetAmount = 0.1 ether;
        nonce = 0;
    }

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a player wins
    /// @param player Address of the winning player
    /// @param amount The bet amount
    /// @param mysteryNumber The generated mystery number
    /// @param displayedNumber The number player guessed against
    event PlayerWon(
        address player,
        uint amount,
        uint mysteryNumber,
        uint displayedNumber
    );

    /// @notice Emitted when a player loses
    /// @param player Address of the losing player
    /// @param amount The bet amount lost
    /// @param mysteryNumber The generated mystery number
    /// @param displayedNumber The number player guessed against
    event PlayerLost(
        address player,
        uint amount,
        uint mysteryNumber,
        uint displayedNumber
    );

    /// @notice Emitted when game status changes
    /// @param online The new game status
    event GameStatusChanged(bool online);

    /// @notice Emitted when maximum bet is updated
    /// @param newMaxBet The new maximum bet amount
    event MaxBetChanged(uint256 newMaxBet);

    /*//////////////////////////////////////////////////////////////
                        INTERNAL FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Generates a pseudo-random number between 1 and 10
     * @dev Uses multiple entropy sources for improved randomness
     * @return A number between 1 and 10 (inclusive)
     *
     * @custom:warning This is pseudo-random and can be predicted by miners.
     *                 For production use, implement Chainlink VRF.
     */
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

    /*//////////////////////////////////////////////////////////////
                          PURE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Determines if a guess is correct
     * @param _number The mystery number
     * @param _display The displayed number
     * @param _guess True if guessing higher, false if guessing lower
     * @return True if the guess is correct
     *
     * Logic:
     * - If _guess is true (higher) and _number > _display: WIN
     * - If _guess is false (lower) and _number < _display: WIN
     * - Otherwise: LOSE
     */
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

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Play the guessing game
     * @dev Players bet ETH and guess if mystery number is higher or lower
     * @param _display The displayed number to guess against (1-10)
     * @param _guess True to guess higher, false to guess lower
     * @return isWinner True if player won
     * @return mystery The actual mystery number generated
     *
     * Requirements:
     * - Game must be online
     * - Bet must be greater than 0
     * - Bet must not exceed maxBetAmount
     * - Contract must have sufficient funds for potential payout
     *
     * Emits {PlayerWon} or {PlayerLost} event
     */
    function winOrLose(
        uint _display,
        bool _guess
    ) external payable noReentrant returns (bool, uint) {
        require(online == true, "The game is not online");
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(msg.value <= maxBetAmount, "Bet exceeds maximum allowed");

        // Ensure contract can pay out if player wins
        require(address(this).balance >= msg.value * 2, "Contract has insufficient funds for payout");

        uint _mysteryNumber = mysteryNumber();
        bool isWinner = determineWinner(_mysteryNumber, _display, _guess);

        if (isWinner == true) {
            players[msg.sender].wins += 1;
            uint256 payout = msg.value * 2;

            // Use call instead of transfer for better gas handling
            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");

            emit PlayerWon(msg.sender, msg.value, _mysteryNumber, _display);
            return (true, _mysteryNumber);
        } else {
            players[msg.sender].losses += 1;
            emit PlayerLost(msg.sender, msg.value, _mysteryNumber, _display);
            return (false, _mysteryNumber);
        }
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Withdraws all contract funds (owner only)
     * @dev Uses reentrancy protection
     */
    function withdrawBet() public onlyOwner noReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = payable(owner).call{value: balance}("");
        require(success, "Transfer failed");
    }

    /**
     * @notice Sets game online/offline status (owner only)
     * @param _online True to enable game, false to disable
     *
     * Emits a {GameStatusChanged} event
     */
    function setOnline(bool _online) public onlyOwner {
        online = _online;
        emit GameStatusChanged(_online);
    }

    /**
     * @notice Updates the maximum bet amount (owner only)
     * @param _maxBet New maximum bet in wei
     *
     * Requirements:
     * - New max bet must be greater than 0
     *
     * Emits a {MaxBetChanged} event
     */
    function setMaxBet(uint256 _maxBet) public onlyOwner {
        require(_maxBet > 0, "Max bet must be greater than 0");
        maxBetAmount = _maxBet;
        emit MaxBetChanged(_maxBet);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the current contract balance
     * @return The balance in wei
     */
    function getContractBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /*//////////////////////////////////////////////////////////////
                          RECEIVE FUNCTION
    //////////////////////////////////////////////////////////////*/

    /// @notice Allows contract to receive ETH directly
    receive() external payable {}
}
