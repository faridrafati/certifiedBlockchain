/**
 * @file randomness.js
 * @description Randomness & predictability failures (Ethernaut level 3).
 *              Snippets are original minimal illustrations of each flaw, not
 *              copies of the level contracts.
 */

export const LEVELS = [
  {
    id: 3,
    slug: 'coin-flip',
    name: 'Coin Flip',
    difficulty: 3,
    category: 'randomness',
    summary: 'A coin flip seeded from the previous block hash, so the caller can compute the result first.',
    attack:
      'The outcome is derived from blockhash(block.number - 1) — the BLOCKHASH opcode — which every ' +
      'contract executing in that same block reads as the identical 32-byte value. An attacker deploys ' +
      'a contract that runs the same arithmetic on that hash, learns the side before wagering, and calls ' +
      'flip() only with the winning guess, all in one transaction. block.timestamp, block.difficulty and ' +
      'block.prevrandao leak the same way: they are consensus inputs visible to the caller, not secrets.',
    prevention:
      'Never seed randomness from chain state the caller can read in the same transaction. Use a ' +
      'commit-reveal scheme so the guess is locked in before the deciding entropy exists, or a ' +
      'verifiable randomness oracle such as Chainlink VRF when the stakes justify the callback cost.',
    vulnerable: `contract Flip {
    uint256 public wins;

    // Every input here is readable by the caller in the same block.
    function flip(bool guess) external returns (bool) {
        uint256 seed = uint256(
            keccak256(abi.encodePacked(blockhash(block.number - 1), block.timestamp))
        );
        bool side = seed % 2 == 1;
        if (side != guess) {
            wins = 0;
            return false;
        }
        wins += 1;
        return true;
    }
}`,
    fixed: `contract Flip {
    struct Commit { bytes32 blinded; uint256 blockNumber; }
    mapping(address => Commit) private commits;
    uint256 public wins;

    // The guess is fixed before the deciding block exists.
    function commitGuess(bytes32 blinded) external {
        commits[msg.sender] = Commit(blinded, block.number);
    }

    function reveal(bool guess, bytes32 salt) external returns (bool) {
        Commit memory c = commits[msg.sender];
        require(c.blinded == keccak256(abi.encodePacked(guess, salt)), "bad reveal");
        require(block.number > c.blockNumber + 1, "too early");
        require(block.number - c.blockNumber < 256, "hash expired");
        delete commits[msg.sender];
        bool side = uint256(blockhash(c.blockNumber + 1)) % 2 == 1;
        if (side != guess) { wins = 0; return false; }
        wins += 1;
        return true;
    }
}`,
    refs: [{ label: 'Play Coin Flip on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/3' }],
  },
];
