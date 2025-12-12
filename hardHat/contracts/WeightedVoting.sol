// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WeightedVoting
 * @author CertifiedBlockchain
 * @notice A weighted voting system where votes have different weights
 * @dev Implements voting where each voter can have a different voting weight.
 *      Owner authorizes voters and assigns their voting weight.
 *      Supports exactly 3 named candidates.
 *
 * Key Features:
 * - Weighted voting (votes can count more based on assigned weight)
 * - Owner authorizes voters and sets their weight
 * - Fixed 3-candidate system with named candidates
 * - One vote per authorized voter
 * - Owner starts with weight 1
 *
 * Use Cases:
 * - Shareholder voting (weight based on shares)
 * - Stakeholder governance
 * - Weighted committee decisions
 *
 * Usage Example:
 * ```javascript
 * // Deploy with 3 candidate names
 * const voting = await WeightedVoting.deploy(["Alice", "Bob", "Charlie"]);
 *
 * // Owner authorizes voters with different weights
 * await voting.authorizeVoter(voter1.address, 10);  // 10 voting power
 * await voting.authorizeVoter(voter2.address, 5);   // 5 voting power
 *
 * // Voters cast their votes (index 0, 1, or 2)
 * await voting.connect(voter1).voteForCandidate(0);  // Vote for Alice with weight 10
 * await voting.connect(voter2).voteForCandidate(1);  // Vote for Bob with weight 5
 *
 * // Check results
 * const aliceVotes = await voting.getVoteForCandidate(0);  // Returns 10
 * ```
 */
contract WeightedVoting {
    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing a voter's status
     */
    struct Voters {
        uint weight;     // Voting power/weight of this voter
        bool hasVoted;   // Whether the voter has already voted
    }

    /**
     * @notice Structure representing a candidate
     */
    struct Candidates {
        string name;     // Candidate's name
        uint voteCount;  // Total weighted votes received
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping of voter addresses to their voter status
    mapping(address => Voters) voters;

    /// @notice Array of exactly 3 candidates
    Candidates[] public candidatesList;

    /// @notice Address of the contract owner
    address public owner;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys the weighted voting contract with 3 candidates
     * @dev Owner is automatically authorized with weight 1
     * @param _Candidates Array of exactly 3 candidate names
     *
     * Note: The contract expects exactly 3 candidates in the array
     */
    constructor(string[] memory _Candidates) {
        candidatesList.push(Candidates({name: _Candidates[0], voteCount: 0}));
        candidatesList.push(Candidates({name: _Candidates[1], voteCount: 0}));
        candidatesList.push(Candidates({name: _Candidates[2], voteCount: 0}));
        owner = msg.sender;
        voters[msg.sender].weight = 1;
        voters[msg.sender].hasVoted = false;
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Authorizes a voter with a specific voting weight (owner only)
     * @dev Cannot authorize an address that has already voted
     * @param _address Address to authorize as a voter
     * @param _weight Voting weight to assign (voting power)
     *
     * Requirements:
     * - Caller must be owner (enforced by assert)
     * - Address must not have already voted (enforced by assert)
     *
     * Note: Uses assert() which will consume all gas on failure
     */
    function authorizeVoter(address _address, uint _weight) public {
        assert(msg.sender == owner);
        assert(!voters[_address].hasVoted);
        voters[_address] = Voters({weight: _weight, hasVoted: false});
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Casts a weighted vote for a candidate
     * @dev Vote weight is determined by the voter's authorized weight
     * @param _index Index of the candidate (0, 1, or 2)
     *
     * Requirements:
     * - Caller must have non-zero voting weight (must be authorized)
     * - Caller must not have already voted
     *
     * Note: The vote count increases by the voter's weight, not just by 1
     */
    function voteForCandidate(uint _index) public {
        require(voters[msg.sender].weight != 0);
        require(voters[msg.sender].hasVoted == false);
        candidatesList[_index].voteCount =
            candidatesList[_index].voteCount +
            voters[msg.sender].weight;
        voters[msg.sender].hasVoted = true;
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the weighted vote count for a candidate
     * @param _index Index of the candidate (0, 1, or 2)
     * @return Total weighted votes received by the candidate
     */
    function getVoteForCandidate(uint _index) public view returns (uint) {
        return candidatesList[_index].voteCount;
    }

    /**
     * @notice Checks if caller is authorized and their voting status
     * @return weight The caller's voting weight (0 if not authorized)
     * @return hasVoted Whether the caller has already voted
     */
    function isAuthorizedVoter() public view returns (uint, bool) {
        return (voters[msg.sender].weight, voters[msg.sender].hasVoted);
    }

    /**
     * @notice Returns all candidates with their current vote counts
     * @return name1 First candidate's name
     * @return votes1 First candidate's vote count
     * @return name2 Second candidate's name
     * @return votes2 Second candidate's vote count
     * @return name3 Third candidate's name
     * @return votes3 Third candidate's vote count
     */
    function getAllCandidatesWithVotes()
        public
        view
        returns (string memory, uint, string memory, uint, string memory, uint)
    {
        return (
            candidatesList[0].name,
            candidatesList[0].voteCount,
            candidatesList[1].name,
            candidatesList[1].voteCount,
            candidatesList[2].name,
            candidatesList[2].voteCount
        );
    }
}
