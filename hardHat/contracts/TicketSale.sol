// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract TicketSale is ERC721 {
    address public owner;
    uint256 public totalOccasions;
    uint256 public totalSupply;
    bool private locked; // Reentrancy guard

    struct Occasion {
        uint256 id;
        string name;
        uint256 cost;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
    }

    mapping(uint256 => Occasion) occasions;
    mapping(uint256 => mapping(address => bool)) public hasBought;
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;

    // Events
    event OccasionListed(uint256 indexed id, string name, uint256 cost, uint256 maxTickets);
    event TicketMinted(uint256 indexed occasionId, uint256 indexed seat, address indexed buyer, uint256 tokenId);
    event Withdrawal(address indexed owner, uint256 amount);

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

    constructor(string [] memory _ticketSale) ERC721(_ticketSale[0], _ticketSale[1]) {
        owner = msg.sender;
    }

    function list(
        string memory _name,
        uint256 _cost,
        uint256 _maxTickets,
        string memory _date,
        string memory _time,
        string memory _location
    ) public onlyOwner {
        require(_maxTickets > 0, "Must have at least 1 ticket");
        require(_cost > 0, "Cost must be greater than 0");
        require(bytes(_name).length > 0, "Name cannot be empty");

        totalOccasions++;
        occasions[totalOccasions] = Occasion(
            totalOccasions,
            _name,
            _cost,
            _maxTickets,
            _maxTickets,
            _date,
            _time,
            _location
        );

        emit OccasionListed(totalOccasions, _name, _cost, _maxTickets);
    }

    function mint(uint256 _id, uint256 _seat) public payable noReentrant {
        // Require that _id is valid
        require(_id != 0, "Invalid occasion ID");
        require(_id <= totalOccasions, "Occasion does not exist");

        // Require that seat number is valid (must be >= 1)
        require(_seat > 0, "Seat number must be greater than 0");
        require(_seat <= occasions[_id].maxTickets, "Seat number exceeds maximum");

        // Require tickets are available
        require(occasions[_id].tickets > 0, "No tickets available");

        // Require that ETH sent is sufficient
        require(msg.value >= occasions[_id].cost, "Insufficient payment");

        // Require that the seat is not taken
        require(seatTaken[_id][_seat] == address(0), "Seat already taken");

        occasions[_id].tickets -= 1; // Update ticket count

        hasBought[_id][msg.sender] = true; // Update buying status
        seatTaken[_id][_seat] = msg.sender; // Assign seat

        seatsTaken[_id].push(_seat); // Update seats currently taken

        totalSupply++;

        _safeMint(msg.sender, totalSupply);

        emit TicketMinted(_id, _seat, msg.sender, totalSupply);

        // Refund excess payment
        uint256 excess = msg.value - occasions[_id].cost;
        if (excess > 0) {
            (bool success, ) = payable(msg.sender).call{value: excess}("");
            require(success, "Refund failed");
        }
    }

    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        require(_id > 0 && _id <= totalOccasions, "Invalid occasion ID");
        return occasions[_id];
    }

    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

    function getAvailableTickets(uint256 _id) public view returns (uint256) {
        require(_id > 0 && _id <= totalOccasions, "Invalid occasion ID");
        return occasions[_id].tickets;
    }

    function withdraw() public onlyOwner noReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    // Get owner address (for frontend compatibility)
    function getOwner() public view returns (address) {
        return owner;
    }
}
