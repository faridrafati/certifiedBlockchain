// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title TicketSale
 * @author CertifiedBlockchain
 * @notice A decentralized event ticketing platform using ERC721 NFTs
 * @dev This contract allows event organizers to create events and sell tickets as NFTs.
 *      Each ticket is a unique NFT representing a specific seat at an event.
 *
 * Key Features:
 * - Event creation with customizable details (name, date, time, location, price)
 * - Seat-based ticketing system where each seat is a unique NFT
 * - Visual seat selection support (seats 1 to maxTickets)
 * - Automatic refund of excess ETH sent during purchase
 * - Owner can withdraw accumulated funds
 * - Reentrancy protection on all value-transferring functions
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const ticketSale = await TicketSale.deploy(["EventTickets", "ETKT"]);
 *
 * // Create an event
 * await ticketSale.list("Concert", ethers.parseEther("0.01"), 100, "Dec 25", "7PM", "NYC");
 *
 * // Purchase ticket for seat 5 at event 1
 * await ticketSale.mint(1, 5, { value: ethers.parseEther("0.01") });
 * ```
 */
contract TicketSale is ERC721 {
    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Contract owner address (event organizer)
    address public owner;

    /// @notice Total number of events/occasions created
    uint256 public totalOccasions;

    /// @notice Total number of tickets (NFTs) minted across all events
    uint256 public totalSupply;

    /// @dev Reentrancy guard flag to prevent reentrant calls
    bool private locked;

    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure representing an event/occasion
     * @dev All events are 1-indexed (id starts from 1)
     */
    struct Occasion {
        uint256 id;           // Unique identifier (1-indexed)
        string name;          // Event name
        uint256 cost;         // Ticket price in wei
        uint256 tickets;      // Remaining available tickets
        uint256 maxTickets;   // Maximum capacity
        string date;          // Event date (e.g., "Dec 25, 2024")
        string time;          // Event time (e.g., "7:00 PM")
        string location;      // Venue/location
    }

    /*//////////////////////////////////////////////////////////////
                              MAPPINGS
    //////////////////////////////////////////////////////////////*/

    /// @dev occasionId => Occasion details
    mapping(uint256 => Occasion) occasions;

    /// @notice Check if address has bought ticket for an event
    /// @dev occasionId => buyerAddress => hasBought
    mapping(uint256 => mapping(address => bool)) public hasBought;

    /// @notice Track seat ownership per event
    /// @dev occasionId => seatNumber => ownerAddress
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;

    /// @dev occasionId => array of taken seat numbers
    mapping(uint256 => uint256[]) seatsTaken;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when a new event is created
    event OccasionListed(uint256 indexed id, string name, uint256 cost, uint256 maxTickets);

    /// @notice Emitted when a ticket is purchased
    event TicketMinted(uint256 indexed occasionId, uint256 indexed seat, address indexed buyer, uint256 tokenId);

    /// @notice Emitted when owner withdraws funds
    event Withdrawal(address indexed owner, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Restricts function access to contract owner only
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
     * @notice Initializes the TicketSale contract
     * @param _ticketSale Array containing [name, symbol] for the ERC721 token
     */
    constructor(string [] memory _ticketSale) ERC721(_ticketSale[0], _ticketSale[1]) {
        owner = msg.sender;
    }

    /*//////////////////////////////////////////////////////////////
                          ADMIN FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new event/occasion
     * @dev Only callable by contract owner. Events are 1-indexed.
     * @param _name Event name (cannot be empty)
     * @param _cost Ticket price in wei (must be > 0)
     * @param _maxTickets Maximum tickets/seats (must be > 0)
     * @param _date Event date string
     * @param _time Event time string
     * @param _location Event venue
     */
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
            _maxTickets,  // Available starts at max
            _maxTickets,
            _date,
            _time,
            _location
        );

        emit OccasionListed(totalOccasions, _name, _cost, _maxTickets);
    }

    /**
     * @notice Withdraws all accumulated ETH from ticket sales
     * @dev Only owner. Uses call for gas efficiency. Protected against reentrancy.
     */
    function withdraw() public onlyOwner noReentrant {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");

        emit Withdrawal(owner, balance);
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Purchases a ticket (mints NFT) for a specific seat
     * @dev Excess ETH is automatically refunded
     * @param _id Event ID (1-indexed)
     * @param _seat Seat number (1 to maxTickets)
     */
    function mint(uint256 _id, uint256 _seat) public payable noReentrant {
        // Validate occasion ID
        require(_id != 0, "Invalid occasion ID");
        require(_id <= totalOccasions, "Occasion does not exist");

        // Validate seat number (1-indexed)
        require(_seat > 0, "Seat number must be greater than 0");
        require(_seat <= occasions[_id].maxTickets, "Seat number exceeds maximum");

        // Check availability
        require(occasions[_id].tickets > 0, "No tickets available");
        require(msg.value >= occasions[_id].cost, "Insufficient payment");
        require(seatTaken[_id][_seat] == address(0), "Seat already taken");

        // Update state
        occasions[_id].tickets -= 1;
        hasBought[_id][msg.sender] = true;
        seatTaken[_id][_seat] = msg.sender;
        seatsTaken[_id].push(_seat);

        // Mint NFT
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

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Get event details by ID
     * @param _id Event ID (1-indexed)
     * @return Occasion struct with all event details
     */
    function getOccasion(uint256 _id) public view returns (Occasion memory) {
        require(_id > 0 && _id <= totalOccasions, "Invalid occasion ID");
        return occasions[_id];
    }

    /**
     * @notice Get all taken seat numbers for an event
     * @param _id Event ID
     * @return Array of taken seat numbers
     */
    function getSeatsTaken(uint256 _id) public view returns (uint256[] memory) {
        return seatsTaken[_id];
    }

    /**
     * @notice Get remaining ticket count for an event
     * @param _id Event ID
     * @return Number of available tickets
     */
    function getAvailableTickets(uint256 _id) public view returns (uint256) {
        require(_id > 0 && _id <= totalOccasions, "Invalid occasion ID");
        return occasions[_id].tickets;
    }

    /**
     * @notice Get contract owner address
     * @return Owner address
     */
    function getOwner() public view returns (address) {
        return owner;
    }
}
