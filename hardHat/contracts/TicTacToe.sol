// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TicTacToe
 * @author CertifiedBlockchain
 * @notice A blockchain-based TicTacToe game with ETH betting
 * @dev Two players bet ETH to play. Winner takes all, draw splits the pot.
 *      Uses a 3x3 board where player addresses mark their positions.
 *
 * Key Features:
 * - Entry fee: 0.001 ETH per player
 * - Winner takes entire pot (2x entry)
 * - Draw splits pot 50/50
 * - Timeout protection for inactive games (365 days default)
 * - Emergency cashout if opponent abandons game
 * - Fallback withdrawal if direct payment fails
 *
 * Game Flow:
 * 1. Player 1 joins with entry fee
 * 2. Player 2 joins with entry fee
 * 3. Random player selected to go first
 * 4. Players alternate placing stones
 * 5. Winner determined by row/column/diagonal match
 *
 * Usage Example:
 * ```javascript
 * // Deploy game
 * const game = await TicTacToe.deploy();
 *
 * // Player 1 joins
 * await game.connect(player1).joinGameasPlayer1({ value: ethers.parseEther("0.001") });
 *
 * // Player 2 joins
 * await game.connect(player2).joinGameasPlayer2({ value: ethers.parseEther("0.001") });
 *
 * // Players make moves (x, y coordinates 0-2)
 * await game.connect(activePlayer).setStone(1, 1);  // Center
 *
 * // Get current board state
 * const board = await game.getBoard();
 * ```
 */
contract TicTacToe {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Entry fee required to join the game
    uint public constant gameCost = 0.001 ether;

    /// @notice Size of the game board (3x3)
    uint8 public boardSize = 3;

    /// @notice Counter for total moves made in current game
    uint8 public movesCounter;

    /// @notice Flag indicating if game is currently in progress
    bool public gameActive;

    /// @notice The current game board (3x3 grid of addresses)
    /// @dev address(0) means empty cell, otherwise player's address
    address[3][3] board;

    /// @notice Empty board template for resetting
    address[3][3] emptyBoard;

    /// @notice Player 1's address (payable for prize distribution)
    address payable public player1;

    /// @notice Player 2's address (payable for prize distribution)
    address payable public player2;

    /// @notice Pending withdrawal amount per address (if direct payment failed)
    /// @dev Keyed by address so a game reset cannot orphan or reassign winnings
    mapping(address => uint) public pendingWithdrawals;

    /// @notice Total ETH reserved for pending withdrawals
    /// @dev Excluded from future payouts so reserved funds are never double-spent
    uint public totalPendingWithdrawals;

    /// @notice Maximum time allowed between moves before emergency cashout
    uint public timeToReact = 365 days;

    /// @notice Timestamp when game becomes invalid (for emergency cashout)
    uint public gameValidUntil;

    /// @notice Address of the player whose turn it is
    address payable public activePlayer;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a player joins the game
    event PlayerJoined(address player);

    /// @notice Emitted when it's the next player's turn
    event NextPlayer(address player);

    /// @notice Emitted when a player wins
    event GameOverWithWin(address winner);

    /// @notice Emitted when game ends in draw
    event GameOverWithDraw();

    /// @notice Emitted when a payout is successfully sent
    event PayoutSuccess(address receiver, uint amountInWei);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the TicTacToe game contract
     * @dev Sets initial game validity timestamp
     */
    constructor() payable {
        gameValidUntil = block.timestamp + timeToReact;
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Join the game as Player 1
     * @dev Requires exact entry fee (0.001 ETH)
     *
     * Requirements:
     * - Player 1 slot must be empty
     * - Must send exactly gameCost (0.001 ETH)
     *
     * Emits {PlayerJoined} and {NextPlayer} events
     */
    function joinGameasPlayer1() public payable {
        require(player1 == address(0), "Player 1 slot already taken");
        if (player2 != address(0)) {
            gameActive = true;
        } else {
            gameActive = false;
        }

        require(msg.value == gameCost, "Entry fee is 0.001 ETH");

        player1 = payable(msg.sender);
        emit PlayerJoined(player1);
        if (block.number % 2 == 0) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }

        gameValidUntil = block.timestamp + timeToReact;

        emit NextPlayer(activePlayer);
    }

    /**
     * @notice Join the game as Player 2
     * @dev Requires exact entry fee (0.001 ETH)
     *
     * Requirements:
     * - Player 2 slot must be empty
     * - Must send exactly gameCost (0.001 ETH)
     *
     * Emits {PlayerJoined} and {NextPlayer} events
     */
    function joinGameasPlayer2() public payable {
        require(player2 == address(0), "Player 2 slot already taken");
        if (player1 != address(0)) {
            gameActive = true;
        } else {
            gameActive = false;
        }

        require(msg.value == gameCost, "Entry fee is 0.001 ETH");

        player2 = payable(msg.sender);
        emit PlayerJoined(player2);
        if (block.number % 2 == 0) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }

        gameValidUntil = block.timestamp + timeToReact;

        emit NextPlayer(activePlayer);
    }

    /**
     * @notice Returns the current board state
     * @return 3x3 array of addresses representing the board
     */
    function getBoard() public view returns (address[3][3] memory) {
        return board;
    }

    /**
     * @notice Resets the game board and player slots
     * @dev Only current players can reset the game
     */
    function resetGame() public {
        require((msg.sender == player1) || (msg.sender == player2), "Only players can reset");
        require(!gameActive, "Cannot reset a game in progress");
        board = emptyBoard;
        movesCounter = 0;
        player1 = payable(address(0));
        player2 = payable(address(0));
    }

    /**
     * @notice Withdraw pending winnings if direct payment failed
     * @dev Uses pull payment pattern for safety
     */
    function withdrawWin() public {
        uint amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No pending winnings");
        pendingWithdrawals[msg.sender] = 0;
        totalPendingWithdrawals -= amount;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Withdrawal failed");
        emit PayoutSuccess(msg.sender, amount);
    }

    /**
     * @notice Emergency cashout if game has timed out
     * @dev Triggers a draw if opponent hasn't moved within timeToReact
     *
     * Requirements:
     * - Game must have timed out
     * - Game must be active
     */
    function emergecyCashout() public {
        require(gameValidUntil < block.timestamp);
        require(gameActive);
        setDraw();
    }

    /**
     * @notice Place a stone on the board
     * @dev Checks for win conditions after each move
     * @param x Row position (0-2)
     * @param y Column position (0-2)
     *
     * Requirements:
     * - Position must be empty
     * - Game must not have timed out
     * - Game must be active
     * - Coordinates must be within bounds
     * - Must be caller's turn
     *
     * Win conditions checked:
     * - Horizontal lines
     * - Vertical lines
     * - Main diagonal
     * - Anti-diagonal
     * - Draw (board full)
     */
    function setStone(uint8 x, uint8 y) public {
        require(x < boardSize && y < boardSize, "Coordinates out of bounds");
        require(board[x][y] == address(0), "Cell already taken");
        require(gameValidUntil > block.timestamp, "Game has timed out");
        require(gameActive, "Game is not active");
        require(msg.sender == activePlayer, "Not your turn");
        board[x][y] = msg.sender;
        movesCounter++;
        gameValidUntil = block.timestamp + timeToReact;

        // Check vertical win
        for (uint8 i = 0; i < boardSize; i++) {
            if (board[i][y] != activePlayer) {
                break;
            }
            if (i == boardSize - 1) {
                setWinner(activePlayer);
                return;
            }
        }

        // Check horizontal win
        for (uint i = 0; i < boardSize; i++) {
            if (board[x][i] != activePlayer) {
                break;
            }
            if (i == boardSize - 1) {
                setWinner(activePlayer);
                return;
            }
        }

        // Check main diagonal
        if (x == y) {
            for (uint i = 0; i < boardSize; i++) {
                if (board[i][i] != activePlayer) {
                    break;
                }
                if (i == boardSize - 1) {
                    setWinner(activePlayer);
                    return;
                }
            }
        }

        // Check anti-diagonal
        if ((x + y) == boardSize - 1) {
            for (uint i = 0; i < boardSize; i++) {
                if (board[i][(boardSize - 1) - i] != activePlayer) {
                    break;
                }
                if (i == boardSize - 1) {
                    setWinner(activePlayer);
                    return;
                }
            }
        }

        // Check for draw
        if (movesCounter == (boardSize ** 2)) {
            setDraw();
            return;
        }

        // Switch active player
        if (activePlayer == player1) {
            activePlayer = player2;
        } else {
            activePlayer = player1;
        }
        emit NextPlayer(activePlayer);
    }

    /*//////////////////////////////////////////////////////////////
                        PRIVATE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets the winner and distributes prize
     * @dev Attempts direct payment, falls back to withdrawal pattern
     * @param player The winning player's address
     */
    function setWinner(address payable player) private {
        gameActive = false;
        emit GameOverWithWin(player);
        // Exclude funds already reserved for earlier failed payouts
        uint balanceToPayOut = address(this).balance - totalPendingWithdrawals;

        // Attempt direct payment, fallback to pull-payment pattern
        (bool success, ) = player.call{value: balanceToPayOut}("");
        if (!success) {
            pendingWithdrawals[player] += balanceToPayOut;
            totalPendingWithdrawals += balanceToPayOut;
        } else {
            emit PayoutSuccess(player, balanceToPayOut);
        }
    }

    /**
     * @notice Sets game as draw and splits pot
     * @dev Each player gets half the pot
     */
    function setDraw() private {
        gameActive = false;
        emit GameOverWithDraw();

        // Cache players so a reentrant resetGame() cannot redirect the payouts
        address payable p1 = player1;
        address payable p2 = player2;

        // Exclude funds already reserved for earlier failed payouts
        uint balanceToPayOut = (address(this).balance - totalPendingWithdrawals) / 2;

        (bool success1, ) = p1.call{value: balanceToPayOut}("");
        if (!success1) {
            pendingWithdrawals[p1] += balanceToPayOut;
            totalPendingWithdrawals += balanceToPayOut;
        } else {
            emit PayoutSuccess(p1, balanceToPayOut);
        }
        (bool success2, ) = p2.call{value: balanceToPayOut}("");
        if (!success2) {
            pendingWithdrawals[p2] += balanceToPayOut;
            totalPendingWithdrawals += balanceToPayOut;
        } else {
            emit PayoutSuccess(p2, balanceToPayOut);
        }
    }
}
