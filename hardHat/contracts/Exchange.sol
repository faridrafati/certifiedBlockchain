// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Exchange {
  // Variables
  address public feeAccount; // the account that receives exchange fees
  uint256 public feePercent; // the fee percentage
  address public tokenAddress; // the DappToken contract address
  address constant ETHER = address(0); // store Ether in tokens mapping with blank address
  mapping(address => mapping(address => uint256)) public tokens;
  mapping(uint256 => _Order) public orders;
  uint256 public orderCount;
  mapping(uint256 => bool) public orderCancelled;
  mapping(uint256 => bool) public orderFilled;

  // Events
  event Deposit(address token, address user, uint256 amount, uint256 balance);
  event Withdraw(address token, address user, uint256 amount, uint256 balance);
  event Order(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );
  event Cancel(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    uint256 timestamp
  );
  event Trade(
    uint256 id,
    address user,
    address tokenGet,
    uint256 amountGet,
    address tokenGive,
    uint256 amountGive,
    address userFill,
    uint256 timestamp
  );

  // Structs
  struct _Order {
    uint256 id;
    address user;
    address tokenGet;
    uint256 amountGet;
    address tokenGive;
    uint256 amountGive;
    uint256 timestamp;
  }

  constructor (address _feeAccount, uint256 _feePercent, address _tokenAddress) {
    feeAccount = _feeAccount;
    feePercent = _feePercent;
    tokenAddress = _tokenAddress;
  }

  // Fallback: reverts if Ether is sent to this smart contract by mistake
  fallback() external {
    revert("Direct ETH transfers not allowed");
  }

  receive() external payable {
    revert("Use depositEther function");
  }

  function depositEther() payable public {
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender] + msg.value;
    emit Deposit(ETHER, msg.sender, msg.value, tokens[ETHER][msg.sender]);
  }

  function withdrawEther(uint _amount) public {
    require(tokens[ETHER][msg.sender] >= _amount, "Insufficient balance");
    tokens[ETHER][msg.sender] = tokens[ETHER][msg.sender] - _amount;
    payable(msg.sender).transfer(_amount);
    emit Withdraw(ETHER, msg.sender, _amount, tokens[ETHER][msg.sender]);
  }

  function depositToken(address _token, uint _amount) public {
    require(_token != ETHER, "Use depositEther for ETH");
    require(IERC20(_token).transferFrom(msg.sender, address(this), _amount), "Transfer failed");
    tokens[_token][msg.sender] = tokens[_token][msg.sender] + _amount;
    emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function withdrawToken(address _token, uint256 _amount) public {
    require(_token != ETHER, "Use withdrawEther for ETH");
    require(tokens[_token][msg.sender] >= _amount, "Insufficient balance");
    tokens[_token][msg.sender] = tokens[_token][msg.sender] - _amount;
    require(IERC20(_token).transfer(msg.sender, _amount), "Transfer failed");
    emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
  }

  function balanceOf(address _token, address _user) public view returns (uint256) {
    return tokens[_token][_user];
  }

  function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
    orderCount = orderCount + 1;
    orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
    emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, block.timestamp);
  }

  function cancelOrder(uint256 _id) public {
    _Order storage _order = orders[_id];
    require(address(_order.user) == msg.sender, "Not order owner");
    require(_order.id == _id, "Order does not exist");
    orderCancelled[_id] = true;
    emit Cancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, block.timestamp);
  }

  function fillOrder(uint256 _id) public {
    require(_id > 0 && _id <= orderCount, "Invalid order ID");
    require(!orderFilled[_id], "Order already filled");
    require(!orderCancelled[_id], "Order already cancelled");
    _Order storage _order = orders[_id];
    _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
    orderFilled[_order.id] = true;
  }

  function _trade(uint256 _orderId, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
    // Fee paid by the user that fills the order, a.k.a. msg.sender.
    uint256 _feeAmount = (_amountGet * feePercent) / 100;

    tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender] - (_amountGet + _feeAmount);
    tokens[_tokenGet][_user] = tokens[_tokenGet][_user] + _amountGet;
    tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount] + _feeAmount;
    tokens[_tokenGive][_user] = tokens[_tokenGive][_user] - _amountGive;
    tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender] + _amountGive;

    emit Trade(_orderId, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, block.timestamp);
  }
}
