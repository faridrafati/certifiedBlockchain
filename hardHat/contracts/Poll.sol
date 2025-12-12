// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Poll
 * @author CertifiedBlockchain
 * @notice A decentralized polling/voting system for creating and voting on polls
 * @dev Supports multiple polls with multiple options each.
 *      Each address can only vote once per poll.
 *
 * Key Features:
 * - Anyone can create polls with custom questions and options
 * - Support for poll thumbnails (image URLs)
 * - One vote per address per poll
 * - Vote tracking for each user
 * - Transparent vote counting
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const poll = await Poll.deploy();
 *
 * // Create a new poll
 * await poll.createPoll(
 *   "What's your favorite blockchain?",
 *   "https://example.com/blockchain.png",
 *   ["Ethereum", "Solana", "Polygon", "Avalanche"]
 * );
 *
 * // Vote on poll ID 0, option index 0 (Ethereum)
 * await poll.vote(0, 0);
 *
 * // Get poll details
 * const [id, question, thumbnail, votes, options] = await poll.getPoll(0);
 *
 * // Check total polls
 * const totalPolls = await poll.getTotalPolls();
 * ```
 */
contract Poll {
    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure containing poll details
     * @dev votes array indices correspond to options array indices
     */
    struct PollItems {
        uint256 id;          // Unique poll identifier
        string question;     // The poll question
        string thumbnail;    // URL to poll thumbnail image
        uint64[] votes;      // Vote count for each option
        string[] options;    // Available voting options
    }

    /**
     * @notice Structure tracking voter activity
     * @dev Uses both array and mapping for efficient lookups
     */
    struct Voter {
        address id;                      // Voter's address
        uint256[] votedIds;              // Array of poll IDs voted on
        mapping(uint256 => bool) votedMap; // Quick lookup for vote status
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Array of all created polls
    PollItems[] private polls;

    /// @notice Mapping of voter addresses to their voting records
    mapping(address => Voter) private voters;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new poll is created
    /// @param _pollId The unique identifier of the new poll
    event PollCreated(uint256 _pollId);

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new poll with a question and multiple options
     * @dev Poll ID is automatically assigned based on array length
     * @param _question The poll question (cannot be empty)
     * @param _thumb URL to a thumbnail image for the poll
     * @param _options Array of voting options (minimum 2 required)
     *
     * Requirements:
     * - Question cannot be empty
     * - At least 2 options must be provided
     *
     * Emits a {PollCreated} event
     */
    function createPoll(
        string memory _question,
        string memory _thumb,
        string[] memory _options
    ) public {
        require(bytes(_question).length > 0, "Empty question");
        require(_options.length > 1, "At least 2 options required");

        uint256 pollId = polls.length;

        PollItems memory newPoll = PollItems({
            id: pollId,
            question: _question,
            thumbnail: _thumb,
            options: _options,
            votes: new uint64[](_options.length)
        });

        polls.push(newPoll);
        emit PollCreated(pollId);
    }

    /**
     * @notice Casts a vote on a specific poll
     * @dev Each address can only vote once per poll
     * @param _pollId The ID of the poll to vote on
     * @param _vote The index of the option to vote for
     *
     * Requirements:
     * - Poll must exist
     * - Vote index must be valid (within options array bounds)
     * - Caller must not have already voted on this poll
     */
    function vote(uint256 _pollId, uint64 _vote) external {
        require(_pollId < polls.length, "Poll does not exist");
        require(_vote < polls[_pollId].options.length, "Invalid vote");
        require(
            voters[msg.sender].votedMap[_pollId] == false,
            "You already voted"
        );

        polls[_pollId].votes[_vote] += 1;

        voters[msg.sender].votedIds.push(_pollId);
        voters[msg.sender].votedMap[_pollId] = true;
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Retrieves all details for a specific poll
     * @param _pollId The ID of the poll to retrieve
     * @return id Poll's unique identifier
     * @return question The poll question
     * @return thumbnail URL to poll thumbnail
     * @return votes Array of vote counts per option
     * @return options Array of voting options
     *
     * Requirements:
     * - Poll must exist (valid pollId)
     */
    function getPoll(
        uint256 _pollId
    )
        external
        view
        returns (
            uint256,
            string memory,
            string memory,
            uint64[] memory,
            string[] memory
        )
    {
        require(_pollId < polls.length && _pollId >= 0, "No poll found");
        return (
            polls[_pollId].id,
            polls[_pollId].question,
            polls[_pollId].thumbnail,
            polls[_pollId].votes,
            polls[_pollId].options
        );
    }

    /**
     * @notice Retrieves voting history for a specific address
     * @param _id The voter's address to query
     * @return voterAddress The voter's address
     * @return votedPollIds Array of poll IDs the voter has voted on
     */
    function getVoter(
        address _id
    ) external view returns (address, uint256[] memory) {
        return (voters[_id].id, voters[_id].votedIds);
    }

    /**
     * @notice Returns the total number of polls created
     * @return The count of all polls
     */
    function getTotalPolls() external view returns (uint256) {
        return polls.length;
    }
}
