// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Certificate
 * @author CertifiedBlockchain
 * @notice A decentralized certificate issuance and verification system
 * @dev This contract allows organizations to issue verifiable credentials
 *      that can be publicly verified by anyone using the credential ID.
 *
 * Key Features:
 * - Owner-only certificate issuance
 * - Public certificate verification by credential ID
 * - Support for both permanent and expiring certificates
 * - Immutable certificate records on blockchain
 *
 * Usage Example:
 * ```javascript
 * // Deploy contract
 * const certificate = await Certificate.deploy();
 *
 * // Issue a certificate (owner only)
 * await certificate.addCertificate(
 *   "CERT-2024-001",           // credentialID
 *   "John Doe",                 // name
 *   "Blockchain Development",   // courseName
 *   "CertifiedBlockchain",      // issuingOrganization
 *   1704067200,                 // issueDate (Unix timestamp)
 *   40000000000,                // expirationDate (use 40000000000 for no expiry)
 *   "Completed all modules"     // reasonForAward
 * );
 *
 * // Verify a certificate (anyone can call)
 * const result = await certificate.checkCertificate("CERT-2024-001");
 * ```
 *
 * Note: Use expirationDate = 40000000000 for certificates that never expire
 */
contract Certificate {
    /*//////////////////////////////////////////////////////////////
                               STRUCTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Structure containing all certificate details
     * @dev All fields are immutable once the certificate is issued
     */
    struct Certified {
        string credentialID;        // Unique identifier for the certificate
        string name;                // Name of the certificate holder
        string courseName;          // Name of the course/program completed
        string issuingOrganization; // Organization that issued the certificate
        uint issueDate;             // Unix timestamp of issuance
        uint expirationDate;        // Unix timestamp of expiration (40000000000 = never)
        string reasonForAward;      // Description of achievement
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Total number of certificates issued
    uint numberOfCertificates = 0;

    /// @notice Mapping for creating new certificates (internal use)
    mapping(string => Certified) newCertified;

    /// @notice Mapping for selected certificate queries (internal use)
    mapping(string => Certified) selectedCertified;

    /// @notice Array storing all issued certificates
    /// @dev Public array allows direct access to certificates by index
    Certified[] public certified;

    /// @notice Address of the contract owner (certificate issuer)
    address owner;

    /*//////////////////////////////////////////////////////////////
                              CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes the certificate contract
     * @dev Sets the deployer as the owner who can issue certificates
     */
    constructor() {
        owner = msg.sender;
        numberOfCertificates = 0;
    }

    /*//////////////////////////////////////////////////////////////
                          VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the total number of certificates issued
     * @return The count of all certificates in the system
     */
    function getNumberOfCertificates() public view returns (uint) {
        return (numberOfCertificates);
    }

    /**
     * @notice Returns the owner address (certificate issuer)
     * @return The address authorized to issue certificates
     */
    function getOwner() public view returns (address) {
        return (owner);
    }

    /*//////////////////////////////////////////////////////////////
                         OWNER FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Issues a new certificate (owner only)
     * @dev Certificate data is immutable once added to the blockchain
     * @param _credentialID Unique identifier for this certificate
     * @param _name Full name of the certificate recipient
     * @param _courseName Name of the course or program completed
     * @param _issuingOrganization Name of the issuing organization
     * @param _issueDate Unix timestamp when certificate was issued
     * @param _expirationDate Unix timestamp when certificate expires
     *        (use 40000000000 for certificates that never expire)
     * @param _reasonForAward Description of the achievement or reason for award
     *
     * Requirements:
     * - Caller must be the contract owner
     */
    function addCertificate(
        string memory _credentialID,
        string memory _name,
        string memory _courseName,
        string memory _issuingOrganization,
        uint _issueDate,
        uint _expirationDate,
        string memory _reasonForAward
    ) public {
        require(owner == msg.sender);
        certified.push(
            Certified({
                credentialID: _credentialID,
                name: _name,
                courseName: _courseName,
                issuingOrganization: _issuingOrganization,
                issueDate: _issueDate,
                expirationDate: _expirationDate,
                reasonForAward: _reasonForAward
            })
        );
        numberOfCertificates++;
    }

    /*//////////////////////////////////////////////////////////////
                         PUBLIC FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Verifies and retrieves a certificate by its credential ID
     * @dev Returns empty values if certificate not found or expired
     * @param _credentialID The unique identifier of the certificate to verify
     * @return credentialID The certificate's unique ID (empty if not found)
     * @return name The recipient's name
     * @return courseName The course name
     * @return issuingOrganization The issuing organization
     * @return issueDate Unix timestamp of issuance
     * @return expirationDate Unix timestamp of expiration
     * @return reasonForAward The reason for the award
     *
     * Note: Returns all empty/zero values if:
     * - Certificate does not exist
     * - Certificate has expired (unless expirationDate is 40000000000)
     */
    function checkCertificate(
        string memory _credentialID
    )
        public
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            uint,
            uint,
            string memory
        )
    {
        for (uint m = 0; m < numberOfCertificates; m++) {
            if (
                keccak256(bytes(certified[m].credentialID)) ==
                keccak256(bytes(_credentialID))
            ) {
                if (
                    (block.timestamp <= certified[m].expirationDate) ||
                    (certified[m].expirationDate == 40000000000)
                ) {
                    return (
                        certified[m].credentialID,
                        certified[m].name,
                        certified[m].courseName,
                        certified[m].issuingOrganization,
                        certified[m].issueDate,
                        certified[m].expirationDate,
                        certified[m].reasonForAward
                    );
                }
            }
        }
        return ("", "", "", "", 0, 0, "");
    }
}
