/**
 * @file arithmetic.js
 * @description Arithmetic & type safety failures (Ethernaut levels 5, 19).
 *              Snippets are original minimal illustrations of each flaw, not
 *              copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 5,
    slug: 'token',
    name: 'Token',
    difficulty: 3,
    category: 'arithmetic',
    summary:
      'Unsigned subtraction wraps past zero, so a balance check that can never fail mints tokens from nothing.',
    attack:
      'The balance guard is written as require(balances[msg.sender] - _value >= 0), but balances are uint256 ' +
      'and an unsigned value is never below zero, so the comparison is a tautology the compiler cannot save you from. ' +
      'On a pre-0.8 compiler (or inside an unchecked block) the SUB opcode wraps modulo 2**256, so sending one more ' +
      'token than you hold sets your balance to roughly 2**256 - 1 instead of reverting. ' +
      'The recipient is credited normally, so the attacker walks away with a real, spendable balance.',
    prevention:
      'Compare the operands directly with require(balance >= amount) instead of testing the sign of a subtraction ' +
      'that cannot be negative. Compile with Solidity 0.8 or later, where checked arithmetic reverts on overflow and ' +
      'underflow, and reserve unchecked blocks for arithmetic you have already proven cannot wrap.',
    vulnerable: `contract Token {
    mapping(address => uint256) public balanceOf;

    constructor(uint256 supply) {
        balanceOf[msg.sender] = supply;
    }

    function transfer(address to, uint256 value) external {
        unchecked {
            // A uint256 is never negative, so this guard is always true...
            require(balanceOf[msg.sender] - value >= 0, "insufficient");

            // ...and SUB wraps modulo 2**256, so 0 - 1 becomes 2**256 - 1.
            balanceOf[msg.sender] -= value;
            balanceOf[to] += value;
        }
    }
}`,
    fixed: `contract Token {
    mapping(address => uint256) public balanceOf;

    constructor(uint256 supply) {
        balanceOf[msg.sender] = supply;
    }

    function transfer(address to, uint256 value) external {
        // Compare the balances themselves; never test the sign of a
        // subtraction that is unsigned by definition.
        require(balanceOf[msg.sender] >= value, "insufficient balance");

        // No unchecked block: solc 0.8 reverts on overflow and underflow.
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
    }
}`,
    refs: [{ label: 'Play Token on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/5' }],
  },
  {
    id: 19,
    slug: 'alien-codex',
    name: 'Alien Codex',
    difficulty: 7,
    category: 'arithmetic',
    summary:
      'Underflowing a dynamic array length turns it into a window over every storage slot, owner included.',
    attack:
      'The contract decrements the length of its bytes32 array without checking that the array holds anything, ' +
      'and that subtraction is unchecked, so an empty array reports a length of 2**256 - 1. ' +
      'A dynamic array stores element i at keccak256(slot) + i, and that address arithmetic also wraps modulo 2**256, ' +
      'so the index 2**256 - keccak256(slot) resolves to storage slot 0 while still passing the now-useless bounds check. ' +
      'One write to that index overwrites slot 0, where the inherited owner address is packed, handing over the contract.',
    prevention:
      'Mutate dynamic arrays only through push and pop, which the compiler bounds-checks, and require(length > 0) ' +
      'before any removal instead of touching the length slot yourself. Keep raw assembly away from length and index ' +
      'arithmetic, and gate state-changing entry points behind onlyOwner rather than a boolean anyone can flip.',
    vulnerable: `contract Codex {
    address public owner = msg.sender;  // slot 0
    bytes32[] private codex;            // slot 1, data at keccak256(1)

    function retract() external {
        // Pre-0.6 this read "codex.length--". The modern equivalent still
        // underflows: an empty array becomes 2**256 - 1 entries long.
        assembly {
            sstore(codex.slot, sub(sload(codex.slot), 1))
        }
    }

    function revise(uint256 i, bytes32 content) external {
        // Every index is now "in bounds", and keccak256(1) + i wraps
        // around to slot 0 -- the owner.
        codex[i] = content;
    }
}`,
    fixed: `contract Codex {
    address public owner = msg.sender;
    bytes32[] private codex;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function record(bytes32 content) external onlyOwner {
        codex.push(content);
    }

    function retract() external onlyOwner {
        require(codex.length > 0, "codex is empty");
        codex.pop();  // pop() reverts on an empty array; length is read-only
    }

    function revise(uint256 i, bytes32 content) external onlyOwner {
        require(i < codex.length, "index out of range");
        codex[i] = content;  // no assembly, so the bounds check still holds
    }
}`,
    refs: [
      { label: 'Play Alien Codex on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/19' },
    ],
  },
];
