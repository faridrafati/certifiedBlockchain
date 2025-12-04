// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    address public owner;
    bool public votingOpen;
    uint public maxCandidates;

    address[] Voters;
    mapping(address => uint) public votes;
    mapping(address => bool) private hasVotedMap; // More efficient than array lookup

    address[] public Candidates;
    uint public numberOfCandidates;

    // Events
    event CandidateAdded(address indexed candidate, uint totalCandidates);
    event VoteCast(address indexed voter, address indexed candidate, uint totalVotes);
    event VotingStatusChanged(bool isOpen);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier whenVotingOpen() {
        require(votingOpen, "Voting is not open");
        _;
    }

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

    // Only owner can add candidates to prevent spam
    function addCandidate(address Candidate) public onlyOwner {
        require(Candidate != address(0), "Invalid candidate address");
        require(!CandidateExists(Candidate), "Candidate already exists");
        require(numberOfCandidates < maxCandidates, "Maximum candidates reached");

        Candidates.push(Candidate);
        numberOfCandidates++;

        emit CandidateAdded(Candidate, numberOfCandidates);
    }

    function voteForCandidate(address Candidate) public whenVotingOpen {
        require(CandidateExists(Candidate), "Candidate does not exist");
        require(!hasVotedMap[msg.sender], "You have already voted");

        votes[Candidate] += 1;
        Voters.push(msg.sender);
        hasVotedMap[msg.sender] = true;

        emit VoteCast(msg.sender, Candidate, votes[Candidate]);
    }

    function CandidateExists(address Candidate) public view returns (bool) {
        for (uint i = 0; i < numberOfCandidates; i++) {
            if (Candidates[i] == Candidate) {
                return true;
            }
        }
        return false;
    }

    // More efficient check using mapping
    function HasVoted(address Voter) public view returns (bool) {
        return hasVotedMap[Voter];
    }

    function VotesForCandidate(address Candidate) public view returns (uint) {
        return votes[Candidate];
    }

    // Owner can open/close voting
    function setVotingStatus(bool _isOpen) public onlyOwner {
        votingOpen = _isOpen;
        emit VotingStatusChanged(_isOpen);
    }

    // Owner can set max candidates limit
    function setMaxCandidates(uint _max) public onlyOwner {
        require(_max >= numberOfCandidates, "Cannot set below current count");
        maxCandidates = _max;
    }

    // Get all candidates
    function getAllCandidates() public view returns (address[] memory) {
        return Candidates;
    }

    // Get total voters count
    function getTotalVoters() public view returns (uint) {
        return Voters.length;
    }

    // Get owner address (for frontend compatibility)
    function getOwner() public view returns (address) {
        return owner;
    }
}
