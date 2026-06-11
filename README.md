# Certified Blockchain DApp

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20%2B-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Web3.js](https://img.shields.io/badge/Web3.js-4.x-F16822.svg)](https://web3js.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive Web3 decentralized application (DApp) built with React, Vite, and Ethereum smart contracts. This project showcases multiple blockchain use cases including a DEX exchange, pet adoption, token sales, voting systems, auctions, and more.

> **Live Demo:** Deployed on Sepolia Testnet - Connect MetaMask to interact.
> All contract addresses are preconfigured, so the app works out of the box - no `.env` required.

## Features

### Core Applications

- **DEX Exchange** - Order-book token exchange with deposits, candlestick price chart, and live order book
- **Pet Adoption DApp** - Adopt virtual pets secured on the blockchain
- **Token Management** - ERC-20 token wallet with crowdsale (ICO) functionality
- **Voting Systems** - Democratic and weighted voting mechanisms
- **Poll Survey** - Create polls and vote with charted results
- **Auction Platform** - Decentralized auction system with cumulative bidding
- **Chat & Messaging** - Blockchain email and a chat box with built-in TicTacToe
- **Certificate Management** - Digital certificate issuance and verification
- **Crypto Doggies** - NFT collectibles with procedurally generated pixel art
- **Guessing Game** - Higher/lower betting game
- **Ticket Sales** - NFT event tickets with seat selection
- **Task Management** - Decentralized todo list

### Technical Highlights

- Modern React 18 with Hooks
- Vite 6 for lightning-fast development
- Route-level code splitting (each dApp loads on demand - initial bundle ~143 KB gzipped)
- Web3.js v4 integration for Ethereum interactions
- MetaMask connectivity with shared wallet-event handling (`useWalletEvents` hook)
- **Fully responsive** - phones (360px+), tablets, and desktop
- Real-time transaction notifications (react-toastify)
- Beautiful dark gradient UI with smooth animations
- Redux-powered exchange with reselect selectors

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)
- [MetaMask](https://metamask.io/) browser extension
- Some Sepolia test ETH ([faucet](https://sepoliafaucet.com/)) to send transactions

## Quick Start

The repo ships with cross-platform launcher scripts that install dependencies
automatically on first run:

```bash
# Windows
run.bat              # start the dev server at http://localhost:3000
run.bat build        # production build into dist/
run.bat compile      # compile the Solidity contracts (hardHat/)
run.bat node         # start a local Hardhat blockchain

# Linux / macOS
chmod +x run.sh      # first time only
./run.sh             # same commands: dev (default) | build | preview | compile | node
```

Or do it manually:

1. **Clone the repository**
   ```bash
   git clone https://github.com/faridrafati/certifiedBlockchain.git
   cd certifiedBlockchain
   ```

2. **Install dependencies and start**
   ```bash
   npm install
   npm run dev
   ```
   The application starts at `http://localhost:3000`.

3. **Environment variables (optional)**
   The Sepolia contract addresses are baked into `src/components/config/*.js`
   as defaults, so no `.env` is needed to run against Sepolia. To point at your
   own deployments, copy the template and override any address:
   ```bash
   cp .env.example .env   # then edit the VITE_*_ADDRESS values
   ```
   Note: Vite reads `.env` once at startup - restart the dev server after editing it.

4. **Compile / deploy contracts** (optional - the Hardhat workspace lives in `hardHat/`)
   ```bash
   cd hardHat
   npm install
   npx hardhat compile
   npx hardhat node                                          # local chain
   npx hardhat run scripts/deploy-script.js --network localhost
   ```
   For Sepolia deployment, set `PRIVATE_KEY` and `SEPOLIA_RPC_URL` in `.env`
   (see `.env.example`) and pass `--network sepolia`.

## Project Structure

```
certifiedblockchain/
├── hardHat/                      # Hardhat workspace (own package.json)
│   ├── contracts/               # Solidity smart contracts (16 contracts)
│   │   ├── Adoption.sol         # Pet adoption tracking
│   │   ├── Auction.sol          # Decentralized auction
│   │   ├── Certificate.sol      # Digital certificate issuance
│   │   ├── ChatBoxPlus.sol      # Chat + TicTacToe game
│   │   ├── CryptoDoggies.sol    # NFT collectibles (ERC-721)
│   │   ├── DappToken.sol        # ERC-20 token
│   │   ├── DappTokenSale.sol    # Token crowdsale (ICO)
│   │   ├── Email.sol            # Decentralized messaging
│   │   ├── Exchange.sol         # Order-book DEX
│   │   ├── GuessingGame.sol     # Blockchain betting game
│   │   ├── Poll.sol             # Polling/survey system
│   │   ├── Task.sol             # Task/todo manager
│   │   ├── TicketSale.sol       # NFT event tickets (ERC-721)
│   │   ├── TicTacToe.sol        # Standalone game
│   │   ├── Voting.sol           # Democratic voting
│   │   └── WeightedVoting.sol   # Weighted voting system
│   ├── scripts/                 # Deployment scripts
│   └── hardhat.config.js        # Hardhat configuration
│
├── src/
│   ├── components/
│   │   ├── config/              # Contract ABIs & addresses (16 config files)
│   │   ├── css/                 # Per-page stylesheets (responsive)
│   │   ├── images/              # Pet images for adoption
│   │   ├── ConfirmDialog.jsx    # Confirmation modal
│   │   ├── ContractInfo.jsx     # Contract details dialog
│   │   ├── HeroSection.jsx      # Shared page header banner
│   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   └── useWalletEvents.js   # Shared MetaMask event hook (with cleanup)
│   │
│   ├── exchange/                # DEX feature (redux store + components)
│   │   ├── components/          # OrderBook, PriceChart, Balance, ...
│   │   └── store/               # actions, reducers, selectors, interactions
│   │
│   ├── App.jsx                  # Main app with lazy-loaded routing
│   ├── navBar.jsx               # Navigation (responsive hamburger menu)
│   ├── adoption.jsx             # Pet adoption page
│   ├── Auction.jsx              # Auction platform
│   ├── Certificate.jsx          # Certificate verification
│   ├── chatBoxStable.jsx        # Chat + game interface
│   ├── CryptoDoggies.jsx        # NFT marketplace
│   ├── dappToken.jsx            # Token wallet
│   ├── dappTokenSale.jsx        # ICO interface
│   ├── Email.jsx                # Messaging system
│   ├── Exchange.jsx             # DEX entry point
│   ├── GuessingGame.jsx         # Higher/Lower game
│   ├── Poll.jsx                 # Polling system
│   ├── Task.jsx                 # Task manager
│   ├── TicketSale.jsx           # Event ticketing
│   ├── Voting.jsx               # Voting interface
│   └── WeightedVoting.jsx       # Weighted voting
│
├── run.bat / run.sh             # Cross-platform launchers
├── vite.config.js               # Vite configuration
├── .env.example                 # Environment variable template
└── README.md                    # This file
```

## Code Documentation

All source files include comprehensive JSDoc/NatSpec documentation:

### Smart Contracts (Solidity)
- NatSpec `@title`, `@author`, `@notice`, `@dev` comments
- Function-level `@param` and `@return` documentation
- Event descriptions and state variable explanations
- Security notes and access control documentation

### React Components
- JSDoc `@file`, `@description`, `@author` headers
- `@component` and `@param` prop documentation
- Feature lists and usage examples
- CSS file references and smart contract associations

### Configuration Files
- Contract function documentation
- Environment variable references
- Event descriptions and data structures

## Smart Contract Configuration

Each contract has a config file in `src/components/config/` that exports its
ABI and address. Addresses default to the verified Sepolia deployments below
and can be overridden per contract via `.env`:

```javascript
// src/components/config/AdoptionConfig.js
export const ADOPTION_ADDRESS =
  import.meta.env.VITE_ADOPTION_ADDRESS || '0x625E...eC17'; // Sepolia default
export const ADOPTION_ABI = [ /* ABI */ ];
```

## Supported Networks

The DApp supports the following Ethereum networks:

| Network   | Chain ID | Explorer                    |
|-----------|----------|-----------------------------|
| Mainnet   | 0x1      | etherscan.io               |
| Goerli    | 0x5      | goerli.etherscan.io        |
| Sepolia   | 0xaa36a7 | sepolia.etherscan.io       |
| Hardhat   | 31337    | localhost                  |
| Ganache   | 1337     | localhost                  |

## Verified Smart Contracts (Sepolia Testnet)

All smart contracts are deployed and verified on the Sepolia testnet (Chain ID: 11155111).

| Contract | Address | Blockscout |
|----------|---------|------------|
| Adoption | `0x625E384A39d8A3C50FA8C5EbEf39a664E9e7eC17` | [View Contract](https://eth-sepolia.blockscout.com/address/0x625E384A39d8A3C50FA8C5EbEf39a664E9e7eC17?tab=contract) |
| Auction | `0xAc07aB3BEEFBB0D107e6f975d48527cF3C16a7E6` | [View Contract](https://eth-sepolia.blockscout.com/address/0xAc07aB3BEEFBB0D107e6f975d48527cF3C16a7E6?tab=contract) |
| Certificate | `0xca1daC5e14Df6CE19ed3a7185250bEB8A3c895F6` | [View Contract](https://eth-sepolia.blockscout.com/address/0xca1daC5e14Df6CE19ed3a7185250bEB8A3c895F6?tab=contract) |
| ChatBoxPlus | `0xBAbe5292d01Cc5F0986AD6B2451A2Ef24b9c5d59` | [View Contract](https://eth-sepolia.blockscout.com/address/0xBAbe5292d01Cc5F0986AD6B2451A2Ef24b9c5d59?tab=contract) |
| CryptoDoggies | `0x0DF3177CBd501eda6ffC64B1c543C058F3953744` | [View Contract](https://eth-sepolia.blockscout.com/address/0x0DF3177CBd501eda6ffC64B1c543C058F3953744?tab=contract) |
| DappToken | `0xfc557fA2A750ECaa504FE1a4AEF48D90F3E74c86` | [View Contract](https://eth-sepolia.blockscout.com/address/0xfc557fA2A750ECaa504FE1a4AEF48D90F3E74c86?tab=contract) |
| DappTokenSale | `0xD85E2446A1C3421612BE36cB6077B308F47D2B03` | [View Contract](https://eth-sepolia.blockscout.com/address/0xD85E2446A1C3421612BE36cB6077B308F47D2B03?tab=contract) |
| Exchange | `0x26203b12bA4Cec5eB24A68834EC57ee47fa0F00B` | [View Contract](https://eth-sepolia.blockscout.com/address/0x26203b12bA4Cec5eB24A68834EC57ee47fa0F00B?tab=contract) |
| Email | `0xF0307B91AF329eAE1f1d24EaAd629108C21592DC` | [View Contract](https://eth-sepolia.blockscout.com/address/0xF0307B91AF329eAE1f1d24EaAd629108C21592DC?tab=contract) |
| GuessingGame | `0xD2b1a870390fEDEc46a06f9870EdEDc5d8F53F84` | [View Contract](https://eth-sepolia.blockscout.com/address/0xD2b1a870390fEDEc46a06f9870EdEDc5d8F53F84?tab=contract) |
| Poll | `0x67C446683398483d54E8c3FF3541a54a5447a6c1` | [View Contract](https://eth-sepolia.blockscout.com/address/0x67C446683398483d54E8c3FF3541a54a5447a6c1?tab=contract) |
| Task | `0xBC37Fe3301C9818Cb7193b510314A141Fc0adA81` | [View Contract](https://eth-sepolia.blockscout.com/address/0xBC37Fe3301C9818Cb7193b510314A141Fc0adA81?tab=contract) |
| TicTacToe | `0x0DA72f02B5c533A2399112292683CD5dAa15580B` | [View Contract](https://eth-sepolia.blockscout.com/address/0x0DA72f02B5c533A2399112292683CD5dAa15580B?tab=contract) |
| Voting | `0x0A917e204214FE1F6Fa9A9cAFdfE18B9184865d8` | [View Contract](https://eth-sepolia.blockscout.com/address/0x0A917e204214FE1F6Fa9A9cAFdfE18B9184865d8?tab=contract) |
| WeightedVoting | `0x89feB6297b6AEC69Bbb81A69a20209Fc89f9128E` | [View Contract](https://eth-sepolia.blockscout.com/address/0x89feB6297b6AEC69Bbb81A69a20209Fc89f9128E?tab=contract) |
| TicketSale | `0xa00f3Ebca957fDC1bC7FB13609cB616B17C879CE` | [View Contract](https://eth-sepolia.blockscout.com/address/0xa00f3Ebca957fDC1bC7FB13609cB616B17C879CE?tab=contract) |

> **Network:** Sepolia Testnet
> **Chain ID:** 11155111
> **Explorer:** https://eth-sepolia.blockscout.com

## Usage

### Connecting Wallet

1. Install MetaMask browser extension
2. Create or import a wallet
3. Click "Connect" when the application loads
4. Approve the connection in MetaMask

### Pet Adoption Flow

1. Browse available pets in the grid
2. Click "Adopt Me" on your favorite pet
3. Confirm the transaction in MetaMask
4. Wait for transaction confirmation
5. Your adopted pet will show "You Own This Pet"

### Token Operations

1. Navigate to the Token page
2. View your token balance
3. Transfer tokens to other addresses
4. Participate in the crowdsale

### Voting

1. Access the Voting or Weighted Voting page
2. View active proposals
3. Cast your vote
4. Track voting results in real-time

### DEX Exchange

1. Navigate to the Exchange page
2. Deposit ETH and/or DAPP tokens into the exchange from the Balance panel
3. Place buy/sell orders, or click an order in the order book to fill it
4. Note the 10% taker fee - filling an order requires `amount + 10%` in your
   exchange balance
5. Track trades on the candlestick price chart and in My Transactions

## Key Features

### Modern UI/UX

- **Mobile and tablet responsive** - tested at 360/480/768/1024px breakpoints
- 44px touch targets, 16px inputs (no iOS auto-zoom), scrollable tables
- Gradient-based dark design with smooth animations
- Loading states and spinners
- Toast notifications for all actions

### Web3 Integration

- Automatic MetaMask detection
- Network and account change handling (shared `useWalletEvents` hook with
  listener cleanup)
- Transaction status tracking with toast feedback
- Error handling with user-friendly messages

### Performance

- Route-level code splitting with `React.lazy` - each dApp page is its own
  chunk; initial JS is ~435 KB (~143 KB gzipped)
- Parallelized contract reads on the exchange (order book loads in one round trip)
- Optimized re-renders with React hooks and reselect memoization
- Dev-only redux logging

## Technologies Used

### Frontend

- React 18.2
- Vite 6
- React Router DOM 6
- Redux + React-Redux + Reselect (exchange feature)
- ApexCharts 4 (candlestick chart and poll results)

### Blockchain

- Web3.js 4.x
- MetaMask Detect Provider
- Solidity 0.8.20+ (OpenZeppelin 5)
- Hardhat 2

### UI/UX

- Material-UI 5
- Bootstrap 5.2 + React Bootstrap
- Font Awesome 4.7
- React Toastify
- Custom responsive CSS with animations

## Development

### Code Style

The project follows modern React best practices:

- Functional components with hooks
- PropTypes for type checking
- ES6+ syntax
- Organized file structure
- Descriptive naming conventions

### Adding New Features

1. Create component in `src/`
2. Add route in `App.jsx`
3. Update navigation in `navBar.jsx`
4. Add smart contract config if needed
5. Test thoroughly with MetaMask

## Troubleshooting

### MetaMask Connection Issues

- Ensure MetaMask is installed and unlocked
- Check that you're on the correct network
- Try refreshing the page
- Clear browser cache if needed

### Transaction Failures

- Ensure sufficient gas fees
- Check account balance
- Verify contract address is correct
- Check network congestion

### Build Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## Security

- Never commit private keys or seed phrases (`.env`, `seed.txt`, `*.key` are gitignored)
- Always verify contract addresses
- Test on testnets before mainnet
- Use environment variables for sensitive data
- Keep dependencies updated

## Smart Contract Architecture

### ERC Standards Implemented
- **ERC-20**: DappToken (fungible token with decimals)
- **ERC-721**: TicketSale, CryptoDoggies (NFT tickets and collectibles)
- **Custom order-book DEX**: Exchange (deposits, orders, fills, 10% fee)

### Security Patterns
- Reentrancy guards and checks-effects-interactions on payable functions
- Pull-payment withdrawals with per-address balances (TicTacToe)
- Access control (owner-only functions)
- Overflow checks (built into Solidity 0.8+)
- Pausable functionality (CryptoDoggies)
- Input validation with descriptive `require` messages

### Known Limitations (educational project)
- GuessingGame and CryptoDoggies use block-based randomness, which is
  predictable by miners - fine for a testnet demo, not for real value
- The Exchange does not lock funds when an order is created; the frontend
  re-validates both parties' balances before filling

### Gas Optimization
- Efficient storage packing
- View functions for read-only operations
- Events for off-chain data indexing

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style and documentation patterns
- Add JSDoc comments to new components
- Add NatSpec comments to new contracts
- Test on Sepolia testnet before submitting PR
- Update README if adding new features

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract implementations
- [Hardhat](https://hardhat.org/) for Ethereum development environment
- [MetaMask](https://metamask.io/) for Web3 wallet connectivity
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) teams for excellent frameworks
- [Material-UI](https://mui.com/) for React components
- [ApexCharts](https://apexcharts.com/) for data visualization

## Contact

For questions, support, or feature requests:
- Open an [issue](../../issues) in this repository
- Check [discussions](../../discussions) for community help

---

**Built with ❤️ by Certified Blockchain Developers**

*Last updated: June 2026*
