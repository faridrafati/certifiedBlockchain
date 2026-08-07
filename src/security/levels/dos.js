/**
 * @file dos.js
 * @description Denial of service failures (Ethernaut levels 9, 20). Snippets
 *              are original minimal illustrations of each flaw, not copies of
 *              the level contracts.
 */

export const LEVELS = [
  {
    id: 9,
    slug: 'king',
    name: 'King',
    difficulty: 6,
    category: 'dos',
    summary: 'Refunding the previous king inline lets that king reject the payment and freeze the throne forever.',
    attack:
      'The receive() function refunds the incumbent with payable(king).transfer(prize) before it crowns ' +
      'the challenger, which puts the old king code on the critical path of every future bid. transfer ' +
      'forwards a 2300 gas stipend and bubbles up any failure, so an attacker takes the throne from a ' +
      'contract that has no receive or fallback function — or one that simply reverts — and every later ' +
      'call to receive() now reverts on that transfer line. Because the payout runs before king and prize ' +
      'are reassigned, the whole state transition is unreachable and the attacker holds the throne ' +
      'permanently, without ever draining a wei from the contract.',
    prevention:
      'Use pull-over-push: credit the outgoing king in a mapping and let them withdraw in a separate ' +
      'transaction, so a recipient that reverts can only block its own refund. Never place an untrusted ' +
      'address on the success path of a state transition, and follow checks-effects-interactions so the ' +
      'bookkeeping is committed before any value leaves the contract.',
    vulnerable: `contract Throne {
    address public king = msg.sender;
    uint256 public prize;

    // The refund is pushed inline, so the old king can veto every new bid.
    receive() external payable {
        require(msg.value > prize, "bid too low");
        payable(king).transfer(prize); // reverts if king rejects ether
        king = msg.sender;
        prize = msg.value;
    }
}`,
    fixed: `contract Throne {
    address public king = msg.sender;
    uint256 public prize;
    mapping(address => uint256) public refunds;

    // Effects only: crowning can never be blocked by the old king code.
    receive() external payable {
        require(msg.value > prize, "bid too low");
        refunds[king] += prize;
        king = msg.sender;
        prize = msg.value;
    }

    // Each ex-king pulls its own refund; a revert hurts only that caller.
    function claimRefund() external {
        uint256 amount = refunds[msg.sender];
        require(amount > 0, "nothing to claim");
        refunds[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "refund failed");
    }
}`,
    refs: [{ label: 'Play King on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/9' }],
  },
  {
    id: 20,
    slug: 'denial',
    name: 'Denial',
    difficulty: 5,
    category: 'dos',
    summary: 'An unchecked call forwards all gas to an attacker-set partner that burns it, so withdrawals always revert.',
    attack:
      'setWithdrawPartner has no access control, so anyone writes their own contract address into the ' +
      'partner storage slot. withdraw() then executes a raw CALL as partner.call{value: share}(""), which ' +
      'forwards all remaining gas and discards the returned boolean. The malicious partner receive() ' +
      'consumes every unit of gas it is handed with an unbounded loop or repeated SSTOREs, and under the ' +
      'EIP-150 63/64 rule the outer frame is left with only one sixty-fourth of the gas — far too little ' +
      'to finish payable(owner).transfer(share) and the trailing storage writes — so the entire withdraw ' +
      'transaction runs out of gas and reverts. Checking the return value would not save it: gas ' +
      'exhaustion kills the caller, not just the callee.',
    prevention:
      'Prefer pull-over-push: record what the partner is owed and let them claim it in their own ' +
      'transaction, so their gas consumption is never charged to the withdrawing account. If a push is ' +
      'truly unavoidable, cap the forwarded gas explicitly with call{value: x, gas: 2300}, check the ' +
      'returned boolean, and apply checks-effects-interactions so every critical state change and the ' +
      'owner payment complete before the untrusted call runs.',
    vulnerable: `contract Payout {
    address public partner; // any caller may claim this slot
    address public owner = msg.sender;

    function setWithdrawPartner(address p) external {
        partner = p;
    }

    function withdraw() external {
        uint256 share = address(this).balance / 100;
        // Forwards all remaining gas and ignores the result.
        partner.call{value: share}("");
        payable(owner).transfer(share);
    }

    receive() external payable {}
}`,
    fixed: `contract Payout {
    address public partner;
    address public owner = msg.sender;
    mapping(address => uint256) public credit;

    function setWithdrawPartner(address p) external {
        partner = p;
    }

    function withdraw() external {
        uint256 share = address(this).balance / 100;
        // Pull-over-push: even an attacker-set partner is only credited.
        credit[partner] += share;
        payable(owner).transfer(share);
    }

    function claim() external {
        uint256 amount = credit[msg.sender];
        credit[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "claim failed");
    }
    receive() external payable {}
}`,
    refs: [{ label: 'Play Denial on Ethernaut', url: 'https://ethernaut.openzeppelin.com/level/20' }],
  },
];
