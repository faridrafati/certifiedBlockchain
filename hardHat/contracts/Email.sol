// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Email
 * @author CertifiedBlockchain
 * @notice A decentralized email/messaging system on the blockchain
 * @dev Allows users to send and receive encrypted messages (bytes32) on-chain.
 *      Each user has separate inboxes for sent and received messages.
 *
 * Key Features:
 * - User registration system
 * - Send messages to any address
 * - Separate sent/received inboxes
 * - Soft-delete functionality for messages
 * - Clear conversations with specific contacts
 * - View all registered users
 *
 * Message Limit: Each inbox can store up to 16 messages (visible via view functions)
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const email = await Email.deploy();
 *
 * // Register as a user
 * await email.connect(user).registerUser();
 *
 * // Send a message (content is bytes32)
 * const content = ethers.encodeBytes32String("Hello!");
 * await email.sendMessage(recipientAddress, content);
 *
 * // Receive messages
 * const [contents, timestamps, senders, deleted] = await email.receiveMessages();
 *
 * // Check inbox size
 * const [sent, received] = await email.getMyInboxSize();
 * ```
 */
contract Email {
    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a single message
     * @dev Content is bytes32 for gas efficiency (32 characters max)
     */
    struct Message {
        address sender;      // Address of the message sender
        address receiver;    // Address of the message recipient
        bytes32 content;     // Message content (32 bytes)
        uint timestamp;      // Unix timestamp when message was sent
        bool deleted;        // Soft deletion flag
    }

    /**
     * @notice Contract-level properties tracking all registered users
     */
    struct ContractProperties {
        address CertChatOwner;           // Contract deployer/owner
        address[] registeredUsersAddress; // All registered user addresses
    }

    /**
     * @notice User inbox containing sent and received messages
     */
    struct Inbox {
        uint numSentMessages;                    // Count of sent messages
        uint numReceivedMessages;                // Count of received messages
        mapping(uint => Message) sentMessages;   // Mapping of sent messages
        mapping(uint => Message) receivedMessages; // Mapping of received messages
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping of user addresses to their inboxes
    mapping(address => Inbox) userInboxes;

    /// @notice Mapping to track user registration status
    mapping(address => bool) hasRegistered;

    /// @notice Template for new inbox initialization
    Inbox newInbox;

    /// @notice Total donations received in wei (unused)
    uint donationsInWei = 0;

    /// @notice Template for new message creation
    Message newMessage;

    /// @notice Contract properties including owner and users list
    ContractProperties contractProperties;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the email contract and registers the deployer
     * @dev Owner is automatically registered as the first user
     */
    constructor() {
        registerUser();
        contractProperties.CertChatOwner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if the caller is registered
     * @return True if caller is registered, false otherwise
     */
    function checkUserRegistration() public view returns (bool) {
        return hasRegistered[msg.sender];
    }

    /**
     * @notice Returns contract properties including owner and all registered users
     * @return owner The contract owner's address
     * @return users Array of all registered user addresses
     */
    function getContractProperties()
        public
        view
        returns (address, address[] memory)
    {
        return (
            contractProperties.CertChatOwner,
            contractProperties.registeredUsersAddress
        );
    }

    /**
     * @notice Retrieves the caller's received messages
     * @dev Returns fixed arrays of 16 elements
     * @return content Array of message contents
     * @return timestamp Array of message timestamps
     * @return sender Array of sender addresses
     * @return deleted Array of deletion flags
     */
    function receiveMessages()
        public
        view
        returns (bytes32[16] memory, uint[] memory, address[] memory, bool[16] memory)
    {
        Inbox storage receiversInbox = userInboxes[msg.sender];
        bytes32[16] memory content;
        address[] memory sender = new address[](16);
        uint[] memory timestamp = new uint[](16);
        bool[16] memory deleted;
        for (uint m = 0; m < 15; m++) {
            Message memory message = receiversInbox.receivedMessages[m];
            content[m] = message.content;
            sender[m] = message.sender;
            timestamp[m] = message.timestamp;
            deleted[m] = message.deleted;
        }
        return (content, timestamp, sender, deleted);
    }

    /**
     * @notice Retrieves the caller's sent messages
     * @dev Returns fixed arrays of 16 elements
     * @return content Array of message contents
     * @return timestamp Array of message timestamps
     * @return receiver Array of receiver addresses
     * @return deleted Array of deletion flags
     */
    function sentMessages()
        public
        view
        returns (bytes32[16] memory, uint[] memory, address[] memory, bool[16] memory)
    {
        Inbox storage sentsInbox = userInboxes[msg.sender];
        bytes32[16] memory content;
        address[] memory receiver = new address[](16);
        uint[] memory timestamp = new uint[](16);
        bool[16] memory deleted;
        for (uint m = 0; m < 15; m++) {
            Message memory message = sentsInbox.sentMessages[m];
            content[m] = message.content;
            receiver[m] = message.receiver;
            timestamp[m] = message.timestamp;
            deleted[m] = message.deleted;
        }
        return (content, timestamp, receiver, deleted);
    }

    /**
     * @notice Returns the caller's inbox message counts
     * @return numSent Number of messages sent
     * @return numReceived Number of messages received
     */
    function getMyInboxSize() public view returns (uint, uint) {
        return (
            userInboxes[msg.sender].numSentMessages,
            userInboxes[msg.sender].numReceivedMessages
        );
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Clears the caller's entire inbox (both sent and received)
     * @dev Completely deletes all messages
     */
    function clearInbox() public {
        delete userInboxes[msg.sender];
    }

    /**
     * @notice Marks all sent messages as deleted
     * @dev Soft deletion - messages still exist but marked as deleted
     */
    function clearOutbox() public {
        Inbox storage senderInbox = userInboxes[msg.sender];
        for (uint i = 0; i < senderInbox.numSentMessages; i++) {
            senderInbox.sentMessages[i].deleted = true;
        }
    }

    /**
     * @notice Clears all messages exchanged with a specific contact
     * @dev Marks both sent and received messages with contact as deleted
     * @param contact The address of the contact to clear conversation with
     */
    function clearConversationWith(address contact) public {
        Inbox storage myInbox = userInboxes[msg.sender];

        // Mark received messages from this contact as deleted
        for (uint i = 0; i < myInbox.numReceivedMessages; i++) {
            if (myInbox.receivedMessages[i].sender == contact) {
                myInbox.receivedMessages[i].deleted = true;
            }
        }

        // Mark sent messages to this contact as deleted
        for (uint i = 0; i < myInbox.numSentMessages; i++) {
            if (myInbox.sentMessages[i].receiver == contact) {
                myInbox.sentMessages[i].deleted = true;
            }
        }
    }

    /**
     * @notice Registers the caller as a new user
     * @dev Can only register once per address
     */
    function registerUser() public {
        if (!hasRegistered[msg.sender]) {
            delete userInboxes[msg.sender];
            hasRegistered[msg.sender] = true;
            contractProperties.registeredUsersAddress.push(msg.sender);
        }
    }

    /**
     * @notice Sends a message to another address
     * @dev Updates both sender's outbox and receiver's inbox
     * @param _receiver The recipient's address
     * @param _content The message content (bytes32)
     */
    function sendMessage(address _receiver, bytes32 _content) public {
        newMessage.content = _content;
        newMessage.timestamp = block.timestamp;
        newMessage.sender = msg.sender;
        newMessage.receiver = _receiver;

        // Update sender's inbox (outbox)
        Inbox storage sendersInbox = userInboxes[msg.sender];
        sendersInbox.sentMessages[sendersInbox.numSentMessages] = newMessage;
        sendersInbox.numSentMessages++;

        // Update receiver's inbox
        Inbox storage receiversInbox = userInboxes[_receiver];
        receiversInbox.receivedMessages[
            receiversInbox.numReceivedMessages
        ] = newMessage;
        receiversInbox.numReceivedMessages++;
        return;
    }
}
