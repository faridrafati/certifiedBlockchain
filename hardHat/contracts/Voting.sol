// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Voting
 * @author CertifiedBlockchain
 * @notice A decentralized candidate voting system with access controls
 * @dev Implements a voting system where candidates are addresses.
 *      Owner can add candidates and control voting status.
 *      Each address can only vote once.
 *
 * Key Features:
 * - Owner-controlled candidate registration
 * - One vote per address
 * - Voting can be opened/closed by owner
 * - Maximum candidate limit to prevent unbounded growth
 * - Event emission for transparency
 *
 * Security Features:
 * - Owner-only administrative functions
 * - Efficient vote tracking with mapping
 * - Maximum candidates limit
 *
 * Usage Example:
 * ```javascript
 * // Deploy with initial candidates
 * const voting = await Voting.deploy([candidate1.address, candidate2.address]);
 *
 * // Owner adds a new candidate
 * await voting.addCandidate(candidate3.address);
 *
 * // Users vote for candidates
 * await voting.connect(voter1).voteForCandidate(candidate1.address);
 *
 * // Check vote count
 * const votes = await voting.VotesForCandidate(candidate1.address);
 *
 * // Owner closes voting
 * await voting.setVotingStatus(false);
 * ```
 */
contract Voting {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the contract owner
    address public owner;

    /// @notice Flag indicating if voting is currently open
    bool public votingOpen;

    /// @notice Maximum number of candidates allowed
    uint public maxCandidates;

    /// @notice Array of all voter addresses
    address[] Voters;

    /// @notice Mapping of candidate addresses to their vote counts
    mapping(address => uint) public votes;

    /// @notice Efficient mapping to check if an address has voted
    mapping(address => bool) private hasVotedMap;

    /// @notice Array of all candidate addresses
    address[] public Candidates;

    /// @notice Current number of registered candidates
    uint public numberOfCandidates;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new candidate is added
    /// @param candidate Address of the new candidate
    /// @param totalCandidates Updated total number of candidates
    event CandidateAdded(address indexed candidate, uint totalCandidates);

    /// @notice Emitted when a vote is cast
    /// @param voter Address of the voter
    /// @param candidate Address of the candidate voted for
    /// @param totalVotes Updated vote count for the candidate
    event VoteCast(address indexed voter, address indexed candidate, uint totalVotes);

    /// @notice Emitted when voting status changes
    /// @param isOpen The new voting status
    event VotingStatusChanged(bool isOpen);

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts function access to contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    /// @notice Requires voting to be open
    modifier whenVotingOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the voting contract with initial candidates
     * @dev Sets deployer as owner, opens voting, and registers initial candidates
     * @param FirstCandidates Array of initial candidate addresses
     *
     * Requirements:
     * - All candidate addresses must be non-zero
     */
    constructor(address[] memory FirstCandidates) {
        owner = msg.sender;
        votingOpen = true;
        maxCandidates = 100; // Prevent unbounded array growth

        for (uint i = 0; i < FirstCandidates.length; i++) {
            require(FirstCandidates[i] != address(0), "Invalid candidate address");
            Candidates.push(FirstCandidates[i]);
            numberOfCandidates++;
        }
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adds a new candidate (owner only)
     * @dev Prevents duplicate candidates and enforces maximum limit
     * @param Candidate Address of the new candidate
     *
     * Requirements:
     * - Caller must be owner
     * - Candidate address must be non-zero
     * - Candidate must not already exist
     * - Must not exceed maximum candidate limit
     *
     * Emits a {CandidateAdded} event
     */
    function addCandidate(address Candidate) public onlyOwner {
        require(Candidate != address(0), "Invalid candidate address");
        require(!CandidateExists(Candidate), "Candidate already exists");
        require(numberOfCandidates < maxCandidates, "Maximum candidates reached");

        Candidates.push(Candidate);
        numberOfCandidates++;

        emit CandidateAdded(Candidate, numberOfCandidates);
    }

    /**
     * @notice Opens or closes voting (owner only)
     * @param _isOpen True to open voting, false to close
     *
     * Emits a {VotingStatusChanged} event
     */
    function setVotingStatus(bool _isOpen) public onlyOwner {
        votingOpen = _isOpen;
        emit VotingStatusChanged(_isOpen);
    }

    /**
     * @notice Updates the maximum candidates limit (owner only)
     * @param _max New maximum candidate limit
     *
     * Requirements:
     * - New limit must be >= current candidate count
     */
    function setMaxCandidates(uint _max) public onlyOwner {
        require(_max >= numberOfCandidates, "Cannot set below current count");
        maxCandidates = _max;
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Casts a vote for a candidate
     * @dev Each address can only vote once
     * @param Candidate Address of the candidate to vote for
     *
     * Requirements:
     * - Voting must be open
     * - Candidate must exist
     * - Caller must not have already voted
     *
     * Emits a {VoteCast} event
     */
    function voteForCandidate(address Candidate) public whenVotingOpen {
        require(CandidateExists(Candidate), "Candidate does not exist");
        require(!hasVotedMap[msg.sender], "You have already voted");

        votes[Candidate] += 1;
        Voters.push(msg.sender);
        hasVotedMap[msg.sender] = true;

        emit VoteCast(msg.sender, Candidate, votes[Candidate]);
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Checks if a candidate is registered
     * @param Candidate Address to check
     * @return True if the address is a registered candidate
     */
    function CandidateExists(address Candidate) public view returns (bool) {
        for (uint i = 0; i < numberOfCandidates; i++) {
            if (Candidates[i] == Candidate) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Checks if an address has already voted
     * @param Voter Address to check
     * @return True if the address has voted
     */
    function HasVoted(address Voter) public view returns (bool) {
        return hasVotedMap[Voter];
    }

    /**
     * @notice Returns the vote count for a candidate
     * @param Candidate Address of the candidate
     * @return Number of votes received
     */
    function VotesForCandidate(address Candidate) public view returns (uint) {
        return votes[Candidate];
    }

    /**
     * @notice Returns all registered candidates
     * @return Array of candidate addresses
     */
    function getAllCandidates() public view returns (address[] memory) {
        return Candidates;
    }

    /**
     * @notice Returns the total number of voters
     * @return Count of addresses that have voted
     */
    function getTotalVoters() public view returns (uint) {
        return Voters.length;
    }

    /**
     * @notice Returns the owner address
     * @return The contract owner's address
     */
    function getOwner() public view returns (address) {
        return owner;
    }
}
