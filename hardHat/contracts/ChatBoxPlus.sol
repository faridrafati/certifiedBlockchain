// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ChatBoxPlus
 * @author CertifiedBlockchain
 * @notice A decentralized chat application with integrated TicTacToe game
 * @dev Combines messaging functionality with a peer-to-peer TicTacToe game.
 *      Users can chat with contacts and challenge them to games.
 *
 * Key Features:
 * - Messaging System:
 *   - User registration with usernames
 *   - Send/receive messages (bytes32)
 *   - Contact list management (up to 64 contacts)
 *   - Soft-delete for messages and conversations
 *
 * - TicTacToe Game:
 *   - Create games with any registered user
 *   - Turn-based gameplay on 3x3 board
 *   - Win detection (rows, columns, diagonals)
 *   - Draw detection
 *   - Game reset functionality
 *
 * Message/Contact Limits:
 * - Max 64 contacts per user
 * - Max 64 messages visible in inbox
 *
 * Usage Example:
 * ```javascript
 * // Deploy with owner's username
 * const username = ethers.encodeBytes32String("Alice");
 * const chat = await ChatBoxPlus.deploy([username]);
 *
 * // Register new user
 * const bobName = ethers.encodeBytes32String("Bob");
 * await chat.connect(bob).registerUser(bobName);
 *
 * // Send message
 * const content = ethers.encodeBytes32String("Hello Bob!");
 * await chat.sendMessage(bob.address, content);
 *
 * // Create a TicTacToe game
 * await chat.createGame(bob.address);
 *
 * // Make a move (x, y coordinates 0-2)
 * await chat.setStone(1, 1, bob.address);  // Center position
 * ```
 */
contract ChatBoxPlus {
    /*//////////////////////////////////////////////////////////////
                          GAME STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a TicTacToe game between two players
     */
    struct Game {
        address player1;          // First player's address
        address player2;          // Second player's address
        bool gameActive;          // Whether game is in progress
        address activePlayer;     // Whose turn it is
        uint8 movesCounter;       // Number of moves made
        address[3][3] board;      // 3x3 game board
        address winner;           // Winner's address (0x0 if no winner)
    }

    /*//////////////////////////////////////////////////////////////
                        MESSAGE STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a chat message
     */
    struct Message {
        address sender;       // Message sender
        address receiver;     // Message recipient
        bytes32 content;      // Message content (32 bytes)
        uint256 timestamp;    // Unix timestamp
        bool XOMessage;       // Flag for game-related messages
        bool deleted;         // Soft deletion flag
    }

    /**
     * @notice Contract-level properties
     */
    struct ContractProperties {
        address CertChatOwner;              // Contract owner
        address[] registeredUsersAddress;   // All user addresses
        bytes32[] registeredUsersName;      // All usernames (parallel array)
    }

    /**
     * @notice User inbox for messages
     */
    struct Inbox {
        uint256 numSentMessages;                    // Sent message count
        uint256 numReceivedMessages;                // Received message count
        mapping(uint256 => Message) sentMessages;   // Sent messages
        mapping(uint256 => Message) receivedMessages; // Received messages
    }

    /*//////////////////////////////////////////////////////////////
                            CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Maximum number of contacts per user
    uint8 constant maxContactListLength = 64;

    /// @notice Maximum messages visible in inbox
    uint8 constant maxMessageLength = 64;

    /*//////////////////////////////////////////////////////////////
                          STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Size of game board (3x3)
    uint8 public boardSize;

    /// @notice Empty board for resetting games
    address[3][3] emptyBoard;

    /// @notice Total number of games created
    uint64 public gameCounter;

    /// @notice Mapping of game ID to Game struct
    mapping(uint256 => Game) public game;

    /// @notice Mapping of user addresses to their inboxes
    mapping(address => Inbox) userInboxes;

    /// @notice Mapping of user addresses to contact lists
    mapping(address => address[maxContactListLength]) public contactList;

    /// @notice Empty contact list for clearing
    address[maxContactListLength] private newContactList;

    /// @notice Tracks user registration status
    mapping(address => bool) hasRegistered;

    /// @notice Template for new inbox
    Inbox newInbox;

    /// @notice Donations counter (unused)
    uint256 donationsInWei = 0;

    /// @notice Template for new messages
    Message newMessage;

    /// @notice Contract properties
    ContractProperties contractProperties;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a game is won
    /// @param winner Address of the winning player
    /// @param looser Address of the losing player
    event GameWinner(address winner, address looser);

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the ChatBoxPlus contract
     * @dev Registers deployer with provided username
     * @param _username Array containing the owner's username as bytes32
     */
    constructor(bytes32[] memory _username) {
        registerUser(_username[0]);
        contractProperties.CertChatOwner = msg.sender;
        gameCounter = 0;
        boardSize = 3;
    }

    /*//////////////////////////////////////////////////////////////
                      REGISTRATION FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if caller is registered
     * @return True if registered
     */
    function checkUserRegistration() public view returns (bool) {
        return hasRegistered[msg.sender];
    }

    /**
     * @notice Registers a new user with a username
     * @param _username The user's chosen username (bytes32)
     */
    function registerUser(bytes32 _username) public {
        if (!hasRegistered[msg.sender]) {
            delete userInboxes[msg.sender];
            hasRegistered[msg.sender] = true;
            contractProperties.registeredUsersAddress.push(msg.sender);
            contractProperties.registeredUsersName.push(_username);
        }
    }

    /**
     * @notice Returns contract properties
     * @return owner Contract owner address
     * @return addresses Array of registered user addresses
     * @return names Array of registered usernames
     */
    function getContractProperties()
        public
        view
        returns (address, address[] memory, bytes32[] memory)
    {
        return (
            contractProperties.CertChatOwner,
            contractProperties.registeredUsersAddress,
            contractProperties.registeredUsersName
        );
    }

    /*//////////////////////////////////////////////////////////////
                       MESSAGING FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Clears all messages from caller's inbox
     */
    function clearInbox() public {
        delete userInboxes[msg.sender];
    }

    /**
     * @notice Marks all sent messages as deleted
     */
    function clearOutbox() public {
        Inbox storage senderInbox = userInboxes[msg.sender];
        for (uint256 i = 0; i < senderInbox.numSentMessages; i++) {
            senderInbox.sentMessages[i].deleted = true;
        }
    }

    /**
     * @notice Clears conversation with a specific contact
     * @param contact Address of the contact
     */
    function clearConversationWith(address contact) public {
        Inbox storage myInbox = userInboxes[msg.sender];

        for (uint256 i = 0; i < myInbox.numReceivedMessages; i++) {
            if (myInbox.receivedMessages[i].sender == contact) {
                myInbox.receivedMessages[i].deleted = true;
            }
        }

        for (uint256 i = 0; i < myInbox.numSentMessages; i++) {
            if (myInbox.sentMessages[i].receiver == contact) {
                myInbox.sentMessages[i].deleted = true;
            }
        }
    }

    /**
     * @notice Sends a message to another user
     * @param _receiver Recipient's address
     * @param _content Message content (bytes32)
     */
    function sendMessage(address _receiver, bytes32 _content) public {
        newMessage.content = _content;
        newMessage.timestamp = block.timestamp;
        newMessage.sender = msg.sender;
        newMessage.receiver = _receiver;

        Inbox storage sendersInbox = userInboxes[msg.sender];
        sendersInbox.sentMessages[sendersInbox.numSentMessages] = newMessage;
        sendersInbox.numSentMessages++;

        Inbox storage receiversInbox = userInboxes[_receiver];
        receiversInbox.receivedMessages[
            receiversInbox.numReceivedMessages
        ] = newMessage;
        receiversInbox.numReceivedMessages++;
        return;
    }

    /**
     * @notice Retrieves received messages
     * @return content Array of message contents
     * @return timestamp Array of timestamps
     * @return sender Array of sender addresses
     * @return deleted Array of deletion flags
     */
    function receiveMessages()
        public
        view
        returns (
            bytes32[maxMessageLength] memory,
            uint256[] memory,
            address[] memory,
            bool[maxMessageLength] memory
        )
    {
        Inbox storage receiversInbox = userInboxes[msg.sender];
        bytes32[maxMessageLength] memory content;
        address[] memory sender = new address[](maxMessageLength);
        uint256[] memory timestamp = new uint256[](maxMessageLength);
        bool[maxMessageLength] memory deleted;
        for (uint256 m = 0; m < maxMessageLength - 1; m++) {
            Message memory message = receiversInbox.receivedMessages[m];
            content[m] = message.content;
            sender[m] = message.sender;
            timestamp[m] = message.timestamp;
            deleted[m] = message.deleted;
        }
        return (content, timestamp, sender, deleted);
    }

    /**
     * @notice Retrieves sent messages
     * @return content Array of message contents
     * @return timestamp Array of timestamps
     * @return receiver Array of receiver addresses
     * @return deleted Array of deletion flags
     */
    function sentMessages()
        public
        view
        returns (
            bytes32[maxMessageLength] memory,
            uint256[] memory,
            address[] memory,
            bool[maxMessageLength] memory
        )
    {
        Inbox storage sentsInbox = userInboxes[msg.sender];
        bytes32[maxMessageLength] memory content;
        address[] memory receiver = new address[](maxMessageLength);
        uint256[] memory timestamp = new uint256[](maxMessageLength);
        bool[maxMessageLength] memory deleted;
        for (uint256 m = 0; m < maxMessageLength - 1; m++) {
            Message memory message = sentsInbox.sentMessages[m];
            content[m] = message.content;
            receiver[m] = message.receiver;
            timestamp[m] = message.timestamp;
            deleted[m] = message.deleted;
        }
        return (content, timestamp, receiver, deleted);
    }

    /**
     * @notice Returns inbox message counts
     * @return numSent Number of sent messages
     * @return numReceived Number of received messages
     */
    function getMyInboxSize() public view returns (uint256, uint256) {
        return (
            userInboxes[msg.sender].numSentMessages,
            userInboxes[msg.sender].numReceivedMessages
        );
    }

    /*//////////////////////////////////////////////////////////////
                      CONTACT LIST FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adds or removes a contact from contact list
     * @param _address Contact's address
     * @param _add True to add, false to remove
     */
    function editMyContactList(address _address, bool _add) public {
        uint256 i = 0;
        if (_add) {
            while (i < maxContactListLength) {
                if (contactList[msg.sender][i] == address(0)) {
                    contactList[msg.sender][i] = _address;
                    i = maxContactListLength;
                }
                i++;
            }
        } else {
            while (i < maxContactListLength) {
                if (contactList[msg.sender][i] == _address) {
                    contactList[msg.sender][i] = address(0);
                    i = maxContactListLength;
                }
                i++;
            }
        }
    }

    /**
     * @notice Clears all contacts from caller's contact list
     */
    function clearMyContactList() public {
        contactList[msg.sender] = newContactList;
    }

    /**
     * @notice Returns caller's contact list
     * @return Array of 64 contact addresses
     */
    function getMyContactList()
        public
        view
        returns (address[maxContactListLength] memory)
    {
        return (contactList[msg.sender]);
    }

    /*//////////////////////////////////////////////////////////////
                       TICTACTOE GAME FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new TicTacToe game with another player
     * @dev Only one game allowed between each pair of players
     * @param _invitedPlayer Address of the player to invite
     * @return True if game created successfully
     *
     * Requirements:
     * - No existing game between these players
     * - Cannot play against yourself
     */
    function createGame(address _invitedPlayer) public returns (bool) {
        bool gameExist;
        uint64 gameIndex;
        (gameExist, gameIndex) = gameIndexFunction(_invitedPlayer);
        require(!gameExist);
        require(_invitedPlayer != msg.sender);
        game[gameCounter].player1 = msg.sender;
        game[gameCounter].player2 = _invitedPlayer;
        game[gameCounter].gameActive = true;
        game[gameCounter].winner = address(0);
        if (block.number % 2 == 0) {
            game[gameCounter].activePlayer = game[gameCounter].player2;
        } else {
            game[gameCounter].activePlayer = game[gameCounter].player1;
        }
        game[gameCounter].movesCounter = 0;
        game[gameCounter].board = emptyBoard;
        gameCounter++;
        return true;
    }

    /**
     * @notice Finds the game index between caller and another player
     * @param _secondPlayer The other player's address
     * @return gameExists True if game exists
     * @return index The game index if exists
     */
    function gameIndexFunction(
        address _secondPlayer
    ) public view returns (bool, uint64) {
        for (uint64 index = 0; index < gameCounter; index++) {
            if (
                ((game[index].player1 == msg.sender) &&
                    (game[index].player2 == _secondPlayer)) ||
                ((game[index].player1 == _secondPlayer) &&
                    (game[index].player2 == msg.sender))
            ) {
                return (true, index);
            }
        }
        return (false, 0);
    }

    /**
     * @notice Returns the game board for a specific opponent
     * @param _secondPlayer The opponent's address
     * @return 3x3 board array
     */
    function getBoard(
        address _secondPlayer
    ) public view returns (address[3][3] memory) {
        bool gameExist;
        uint64 gameIndex;
        (gameExist, gameIndex) = gameIndexFunction(_secondPlayer);
        require(gameExist);
        return game[gameIndex].board;
    }

    /**
     * @notice Resets an existing game with another player
     * @param _secondPlayer The opponent's address
     */
    function resetGame(address _secondPlayer) public {
        bool gameExist;
        uint64 gameIndex;
        (gameExist, gameIndex) = gameIndexFunction(_secondPlayer);
        require(gameExist);
        game[gameIndex].board = emptyBoard;
        game[gameIndex].gameActive = true;
        if (block.number % 2 == 0) {
            game[gameIndex].player1 = msg.sender;
            game[gameIndex].player2 = _secondPlayer;
        } else {
            game[gameIndex].player1 = _secondPlayer;
            game[gameIndex].player2 = msg.sender;
        }
        game[gameIndex].activePlayer = game[gameIndex].player1;
        game[gameIndex].movesCounter = 0;
        game[gameIndex].board = emptyBoard;
        game[gameIndex].winner = address(0);
    }

    /**
     * @notice Places a stone on the game board
     * @dev Checks for win conditions after each move
     * @param x Row position (0-2)
     * @param y Column position (0-2)
     * @param _secondPlayer The opponent's address
     *
     * Requirements:
     * - Game must exist
     * - Position must be empty
     * - Game must be active
     * - Must be caller's turn
     */
    function setStone(uint8 x, uint8 y, address _secondPlayer) public {
        bool gameExist;
        uint64 gameIndex;
        (gameExist, gameIndex) = gameIndexFunction(_secondPlayer);
        require(gameExist);
        require(game[gameIndex].board[x][y] == address(0));
        assert(game[gameIndex].gameActive);
        assert(x < boardSize);
        assert(y < boardSize);
        require(msg.sender == game[gameIndex].activePlayer);
        game[gameIndex].board[x][y] = msg.sender;
        game[gameIndex].movesCounter++;

        // Check vertical win
        for (uint8 i = 0; i < boardSize; i++) {
            if (game[gameIndex].board[i][y] != game[gameIndex].activePlayer) {
                break;
            }
            if (i == boardSize - 1) {
                setWinner(game[gameIndex].activePlayer, _secondPlayer);
                return;
            }
        }

        // Check horizontal win
        for (uint256 i = 0; i < boardSize; i++) {
            if (game[gameIndex].board[x][i] != game[gameIndex].activePlayer) {
                break;
            }
            if (i == boardSize - 1) {
                setWinner(game[gameIndex].activePlayer, _secondPlayer);
                return;
            }
        }

        // Check main diagonal
        if (x == y) {
            for (uint256 i = 0; i < boardSize; i++) {
                if (
                    game[gameIndex].board[i][i] != game[gameIndex].activePlayer
                ) {
                    break;
                }
                if (i == boardSize - 1) {
                    setWinner(game[gameIndex].activePlayer, _secondPlayer);
                    return;
                }
            }
        }

        // Check anti-diagonal
        if ((x + y) == boardSize - 1) {
            for (uint256 i = 0; i < boardSize; i++) {
                if (
                    game[gameIndex].board[i][(boardSize - 1) - i] !=
                    game[gameIndex].activePlayer
                ) {
                    break;
                }
                if (i == boardSize - 1) {
                    setWinner(game[gameIndex].activePlayer, _secondPlayer);
                    return;
                }
            }
        }

        // Check for draw
        if (game[gameIndex].movesCounter == (boardSize ** 2)) {
            setDraw(_secondPlayer);
            return;
        }

        // Switch active player
        if (game[gameIndex].activePlayer == game[gameIndex].player1) {
            game[gameIndex].activePlayer = game[gameIndex].player2;
        } else {
            game[gameIndex].activePlayer = game[gameIndex].player1;
        }
    }

    /*//////////////////////////////////////////////////////////////
                      PRIVATE GAME FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Sets the winner of a game
     * @param player The winning player
     * @param _secondPlayer The opponent
     */
    function setWinner(address player, address _secondPlayer) private {
        bool gameExist;
        uint64 gameIndex;
        (gameExist, gameIndex) = gameIndexFunction(_secondPlayer);
        require(gameExist);
        game[gameIndex].gameActive = false;
        if (msg.sender == player) {
            emit GameWinner(player, _secondPlayer);
            game[gameIndex].winner = player;
        } else {
            emit GameWinner(_secondPlayer, player);
            game[gameIndex].winner = _secondPlayer;
        }
    }

    /**
     * @notice Sets a game as draw
     * @param _secondPlayer The opponent's address
     */
    function setDraw(address _secondPlayer) private {
        bool gameExist;
        uint64 gameIndex;
        (gameExist, gameIndex) = gameIndexFunction(_secondPlayer);
        require(gameExist);
        game[gameIndex].gameActive = false;
    }
}
