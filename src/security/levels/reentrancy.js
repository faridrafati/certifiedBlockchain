/**
 * @file reentrancy.js
 * @description Reentrancy and ordering failures (Ethernaut levels 10, 40). Snippets are
 *              original
 *              minimal illustrations of each flaw, not copies of the level
 *              contracts.
 */

export const LEVELS = [
  {
    id: 10,
    slug: 're-entrancy',
    name: 'Re-entrancy',
    difficulty: 6,
    category: 'reentrancy',
    summary:
      'Ether leaves through a raw call before the balance is decremented, so the callee re-enters and drains it.',
    attack:
      'withdraw() reads balances[msg.sender], forwards the ether with a raw CALL that hands the recipient ' +
      'all remaining gas, and only decrements that mapping slot after the call returns. A contract ' +
      'recipient re-enters withdraw() from its receive() function while its balance entry still holds the ' +
      'pre-withdrawal value, so the balance check passes again and another CALL fires in the nested frame. ' +
      'The recursion repeats until the contract is empty, and the deferred subtractions then unwind against ' +
      'a balance that was never reduced in time — on a pre-0.8 compiler the last one underflows outright.',
    prevention:
      'Follow checks-effects-interactions: validate the request, write the reduced balance to storage, and ' +
      'only then make the external call. Layer OpenZeppelin ReentrancyGuard (nonReentrant) on every function ' +
      'that pays out, and prefer pull-over-push accounting so untrusted code never executes mid-update.',
    vulnerable: `contract Donations {
    mapping(address => uint256) public balances;

    function donate(address to) external payable {
        balances[to] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "insufficient");
        // Interaction before effect: the callee re-enters with the
        // balance slot still untouched.
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] -= amount;
    }
}`,
    fixed: `contract Donations {
    mapping(address => uint256) public balances;
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function donate(address to) external payable {
        balances[to] += msg.value;
    }

    // Checks, then effects, then the interaction.
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "insufficient");
        balances[msg.sender] -= amount;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
    }
}`,
    refs: [
      { label: 'Play Re-entrancy on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/10' },
    ],
  },
  {
    id: 40,
    slug: 'not-optimistic-portal',
    name: 'NotOptimisticPortal',
    difficulty: 8,
    category: 'reentrancy',
    summary: 'The portal runs a withdrawal message before proving it, and its message hash omits the final call.',
    attack:
      'executeMessage() walks the caller’s receiver and calldata arrays and performs every target.call — ' +
      'an arbitrary address, with only the four-byte entry point pinned — before _verifyMessageInclusion() ' +
      'runs and before executedMessages[hash] is set. The commitment itself is broken ' +
      'too: _computeMessageSlot() folds only i < length - 1 entries into its accumulated hashes, so the ' +
      'last receiver/data pair is never committed — and a one-element message commits to no operation ' +
      'at all. One proven withdrawal hash therefore authorises a different final call, while the ERC20 ' +
      '_mint at the end of the function still pays out against it.',
    prevention:
      'Apply checks-effects-interactions: verify the inclusion proof and write executedMessages[hash] = true ' +
      'before any external call, and treat ReentrancyGuard as a backstop rather than the only ordering ' +
      'defence. Commit to the entire payload in one keccak256 over abi.encode of the full arrays — lengths ' +
      'included — so no element of an authorised message can be swapped after it was proven.',
    vulnerable: `abstract contract Portal is ERC20 {
    mapping(bytes32 => bool) public executed;
    function execute(
        address to, uint256 amt,
        address[] calldata t, bytes[] calldata d, bytes calldata proof
    ) external {
        bytes32 h;
        // Off by one: the final t/d pair is never folded in.
        for (uint256 i; i < t.length - 1; i++) {
            h = keccak256(abi.encode(h, t[i], d[i]));
        }
        h = keccak256(abi.encode(to, amt, h));
        require(!executed[h], "already executed");
        for (uint256 i; i < t.length; i++) {
            (bool ok, ) = t[i].call(d[i]); // interaction first
            require(ok, "call failed");
        }
        require(_proven(h, proof), "bad proof"); // checked too late
        executed[h] = true;
        _mint(to, amt);
    }
    function _proven(bytes32, bytes calldata) internal view virtual returns (bool);
}`,
    fixed: `abstract contract Portal is ERC20, ReentrancyGuard {
    mapping(bytes32 => bool) public executed;
    function execute(
        address to, uint256 amt,
        address[] calldata t, bytes[] calldata d, bytes calldata proof
    ) external nonReentrant {
        // One hash over the whole payload, array lengths included.
        bytes32 h = keccak256(abi.encode(to, amt, t, d));
        require(!executed[h], "already executed");
        require(_proven(h, proof), "bad proof"); // checks
        executed[h] = true;                      // effects
        _mint(to, amt);
        for (uint256 i; i < t.length; i++) {
            (bool ok, ) = t[i].call(d[i]);       // interactions last
            require(ok, "call failed");
        }
    }
    function _proven(bytes32, bytes calldata) internal view virtual returns (bool);
}`,
    refs: [
      { label: 'Play NotOptimisticPortal on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/40' },
    ],
  },
];
