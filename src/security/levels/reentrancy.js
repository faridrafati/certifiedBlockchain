/**
 * @file reentrancy.js
 * @description Reentrancy failures (Ethernaut level 10). Snippets are original
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
];
