# Certified Blockchain DApp

[![Solidity](https://img.shields.io/badge/Solidity-0.8.x-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Web3.js](https://img.shields.io/badge/Web3.js-4.x-F16822.svg)](https://web3js.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

A comprehensive Web3 decentralized application (DApp) built with React, Vite, and Ethereum smart contracts. This project showcases multiple blockchain use cases including a DEX exchange, a no-code token factory, pet adoption, token sales, voting systems, auctions, and a smart contract security reference.

> **Live Demo:** Deployed on Sepolia Testnet - Connect MetaMask to interact.
> All contract addresses are preconfigured, so the app works out of the box - no `.env` required.
> The Security reference page needs no wallet at all.

## Features

### Core Applications

- **DEX Exchange** - Order-book token exchange with deposits, candlestick price chart, and live order book
- **TokenForge** - No-code ERC-20 factory: pick features (mintable, capped, pausable, taxable, ...) and deploy your own token on-chain
- **Security Reference** - Public, wallet-free reference of smart contract vulnerabilities (see below)
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

### Security Reference (`#/security`)

A documentation view covering how on-chain code fails, presented as five tabs
built from six public sources, and readable without connecting a wallet:

| Tab | Contents | Source |
|-----|----------|--------|
| Ethernaut Levels | 41 levels across 10 vulnerability classes, each with an attack walkthrough, a prevention takeaway, and a vulnerable/secure Solidity pair | [Ethernaut](https://ethernaut.openzeppelin.com/) |
| Hack Patterns | 18 classic hacks, each with vulnerable, attacker, and fixed contracts | [Solidity by Example](https://solidity-by-example.org/hacks/re-entrancy/) |
| Pitfalls Checklist | 101 filterable pre-deploy checks, original numbering preserved | [Secureum 101](https://secureum.substack.com/p/security-pitfalls-and-best-practices-101) |
| Static Analysis | 100 detectors in a sortable table with check ids, severity, and confidence | [Slither](https://github.com/crytic/slither/wiki/Detector-Documentation) |
| Standards | 70 requirements grouped by level [S]/[M]/[Q], plus audit-practice notes | [EEA EthTrust](https://entethalliance.org/specs/ethtrust-sl/) and [Polymarket](https://github.com/Polymarket/contract-security) |

Content is summarized rather than reproduced, and every tab links out to the
source it was built from. Ethernaut levels, hack patterns, and EthTrust
requirements also carry a per-entry link; the Slither and Secureum tabs preserve
the upstream check ids and item numbers so an entry can be looked up in the
source document. Syntax highlighting comes from a ~90-line in-repo Solidity
tokenizer, so the feature adds no npm dependencies.

### Technical Highlights

- Modern React 18 with Hooks
- Vite 6 for lightning-fast development
- Route-level code splitting (each dApp loads on demand - initial bundle ~145 KB gzipped)
- Web3.js v4 integration for Ethereum interactions
- MetaMask connectivity with shared wallet-event handling (`useWalletEvents` hook)
- **Fully responsive** - phones (360px+), tablets, and desktop
- Real-time transaction notifications (react-toastify)
- Dark "web3 operations" design system driven by CSS custom properties
  (`src/components/css/index.css`) - one token contract for color, type,
  spacing, radii, shadows, and motion across every page
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
   Routing uses `HashRouter`, so in-app paths live after a `#` - the security
   page is `http://localhost:3000/#/security`, not `/security`.

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
│   ├── contracts/               # Solidity smart contracts (20 contracts)
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
│   │   ├── WeightedVoting.sol   # Weighted voting system
│   │   └── tokenforge/          # ERC-20 factory (TokenFactory, ForgeToken,
│   │                            #   ForgeTokenDeployer, ForgeTypes)
│   ├── scripts/                 # Deployment scripts
│   └── hardhat.config.js        # Hardhat configuration
│
├── src/
│   ├── components/
│   │   ├── config/              # Contract ABIs & addresses (17 config files)
│   │   ├── css/                 # Per-page stylesheets + index.css design tokens
│   │   ├── images/              # Page images (pets, auction, certificate, games)
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
│   ├── tokenforge/              # Token factory catalog (features, pricing, rules)
│   │
│   ├── security/                # Security reference page (no wallet required)
│   │   ├── data/                # hacks, detectors/, pitfalls/, standards,
│   │   │                        #   auditPractice + index.js aggregator
│   │   ├── levels/              # 41 Ethernaut entries, one module per class
│   │   ├── catalog.js           # Categories + aggregated level list
│   │   ├── tokenizeSolidity.js  # Dependency-free Solidity tokenizer
│   │   ├── Security.jsx         # Tabbed page shell
│   │   ├── LevelCard.jsx        # Ethernaut level card
│   │   ├── HackCard.jsx         # Hack pattern card (3 code blocks)
│   │   ├── DetectorTable.jsx    # Sortable Slither detector table
│   │   ├── PitfallList.jsx      # Secureum checklist
│   │   ├── StandardsView.jsx    # EthTrust requirements + audit practice
│   │   ├── SolidityCode.jsx     # Highlighted code block with copy button
│   │   └── security.css         # Styles for the security page
│   │
│   ├── index.jsx                # React entry point (mounts App, loads global CSS)
│   ├── App.jsx                  # Main app with lazy-loaded routing
│   ├── navBar.jsx               # Navigation (responsive hamburger menu)
│   ├── modalForm.jsx            # Wallet-connect modal (gates non-public routes)
│   ├── notFound.jsx             # 404 page
│   ├── form.jsx                 # Joi-validated form base class (class component)
│   ├── input.jsx / select.jsx / loginForm.jsx
│   │                            # Form field primitives used by form.jsx
│   ├── assets/, logo.svg, metamask.svg
│   │                            # Inline SVG icons and brand marks
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
│   ├── TokenForge.jsx           # No-code ERC-20 factory
│   ├── Voting.jsx               # Voting interface
│   └── WeightedVoting.jsx       # Weighted voting
│
├── public/                      # Static assets copied verbatim into dist/
├── design-system/               # Generated design system (MASTER.md tokens)
├── docs/superpowers/            # Feature specs and implementation plans
├── client/                      # Legacy Truffle build artifacts - not used by the app
├── cryptoDoggies/               # Legacy standalone CryptoDoggies prototype - not used by the app
├── index.html                   # Vite HTML entry point
├── run.bat / run.sh             # Cross-platform launchers
├── vite.config.js               # Vite configuration
├── .env.example                 # Environment variable template
├── seed.txt                     # Local only, untracked - compromised, see Security
├── *.md, projectSteps.txt       # Assorted development notes from earlier work
└── README.md                    # This file
```

## Code Documentation

Most source files carry JSDoc/NatSpec documentation in the patterns below - 77
of the 94 JS/JSX files under `src/` have a `@file` header, and every contract
but one has NatSpec. The gaps are the DEX feature (`src/Exchange.jsx`,
`src/exchange/**`, and `Exchange.sol`) plus the generated pixel-art data module
`src/components/doggyidparser.js`; they predate this convention and have only
inline comments, so bringing them up to the same standard is an open task:

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
ABI and address. Addresses default to the Sepolia deployments listed below
and can be overridden per contract via `.env`:

```javascript
// src/components/config/AdoptionConfig.js
export const ADOPTION_ADDRESS =
  import.meta.env.VITE_ADOPTION_ADDRESS || '0x625E...eC17'; // Sepolia default
export const ADOPTION_ABI = [ /* ABI */ ];
```

## Supported Networks

The app labels the chain it is connected to and links contracts to a block
explorer. These are the chains it recognizes by name:

| Network      | Chain ID | Explorer link                |
|--------------|----------|------------------------------|
| Sepolia      | 11155111 | eth-sepolia.blockscout.com   |
| Mainnet      | 1        | etherscan.io                 |
| Polygon      | 137      | polygonscan.com              |
| Mumbai       | 80001    | mumbai.polygonscan.com       |
| BSC          | 56       | falls back to etherscan.io   |
| BSC Testnet  | 97       | falls back to etherscan.io   |
| Goerli       | 5        | goerli.etherscan.io          |

**Sepolia is the only network the deployed contracts live on** - the addresses
in `src/components/config/*.js` are Sepolia deployments, so connecting to any
other chain will label correctly but find no contracts. Goerli and Mumbai are
retained from earlier development and are no longer operating testnets.

Any other chain (including a local Hardhat node at 31337 or Ganache at 1337)
connects fine and is labelled `chain-<id>`, but you will need to deploy the
contracts yourself and point the `VITE_*_ADDRESS` variables at them.

## Deployed Smart Contracts (Sepolia Testnet)

All of these are deployed on the Sepolia testnet (Chain ID: 11155111). Every one
has its source verified on Blockscout except the TokenForge factory, which is
deployed but not yet source-verified.

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
| TokenForge Factory (not source-verified) | `0x782f1DA03d5faedd2613d27E9055613F68216911` | [View Contract](https://eth-sepolia.blockscout.com/address/0x782f1DA03d5faedd2613d27E9055613F68216911?tab=contract) |
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

### TokenForge (create your own token)

1. Open the TokenForge page and pick a template, or start from scratch
2. Set name, symbol, and supply model (fixed, capped, or unlimited)
3. Toggle features - access control, mintable, burnable, pausable, taxable,
   anti-whale, and more; the order summary prices each line item as you go
4. Deploy and confirm in MetaMask; the factory returns your token's address

### Security Reference (no wallet needed)

1. Open the Security page - it renders without connecting MetaMask
2. Pick a tab: Ethernaut Levels, Hack Patterns, Pitfalls Checklist,
   Static Analysis, or Standards
3. Search or filter by vulnerability class, severity, or tag
4. Expand any entry for the attack walkthrough and side-by-side
   vulnerable/secure code, and follow the source link to go deeper

## Key Features

### Modern UI/UX

- **Mobile and tablet responsive** - tested at 360/480/768/1024px breakpoints
- 44px touch targets, 16px inputs (no iOS auto-zoom), scrollable tables
- Design token system in `src/components/css/index.css`: dark slate surfaces,
  violet primary, signal-green CTAs, Orbitron/Exo 2 type. Pages consume the
  tokens rather than raw hex, and a Bootstrap 5.3 bridge maps components to them
- Accessibility: visible focus rings, `prefers-reduced-motion` honored, status
  conveyed by text as well as color, ARIA tabs on the security reference
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
  chunk; initial JS is ~439 KB (~145 KB gzipped). The security reference is the
  largest page chunk (~311 KB) and is never downloaded unless visited
- Parallelized contract reads on the exchange (order book loads in one round trip)
- Optimized re-renders with React hooks and reselect memoization
- Dev-only redux logging

## Technologies Used

### Frontend

- React 18.3
- Vite 6
- React Router DOM 6
- Redux + React-Redux + Reselect (exchange feature)
- ApexCharts 4 (candlestick chart and poll results)

### Blockchain

- Web3.js 4.x
- MetaMask Detect Provider
- Solidity 0.8.x with OpenZeppelin 5 - most contracts pin `^0.8.20`, the
  TokenForge contracts and CryptoDoggies `^0.8.24`, DappTokenSale `0.8.28`, and
  Exchange still `^0.8.0`; `hardHat/hardhat.config.js` configures the 0.8.0,
  0.8.20, and 0.8.28 compilers to cover them
- Hardhat 2

### UI/UX

- Material-UI 5 (dark `ThemeProvider` aligned with the design tokens)
- Bootstrap 5.3 + React Bootstrap (dark mode via `data-bs-theme`)
- Font Awesome 4.7
- React Toastify
- Custom responsive CSS built on CSS custom properties

## Development

### Code Style

The project follows modern React best practices:

- Functional components with hooks, with nine class components left over: the
  DEX containers (`src/Exchange.jsx` plus `Balance`, `Content`, `MyTransactions`,
  `NewOrder`, `OrderBook`, `PriceChart`, and `Trades` in
  `src/exchange/components/`) and the Joi form base class `src/form.jsx`
- PropTypes for type checking (note: `prop-types` is not a declared dependency
  in `package.json` and currently resolves transitively)
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

- Never commit private keys or seed phrases. `.gitignore` covers `.env`,
  `seed.txt`, `*.mnemonic`, and `*.key`.
- **`seed.txt` was committed in the initial commit and has since been
  untracked.** Removing it from the index stops future commits from carrying it,
  but it remains in the git history and in any existing clone or fork. Treat the
  mnemonic and every key derived from it as public: move any funds off that
  wallet and never fund it again.
- Always verify contract addresses
- Test on testnets before mainnet
- Use environment variables for sensitive data
- Keep dependencies updated

The in-app **Security** page (`#/security`) documents the vulnerability classes
behind these rules - reentrancy, access control, storage collisions,
predictable randomness, and more - with runnable-looking vulnerable/secure
pairs. Treat it as a study aid, not an audit: this is an educational testnet
project and its contracts have not been professionally audited.

## Smart Contract Architecture

### ERC Standards Implemented
- **ERC-20**: DappToken (fungible token with decimals), ForgeToken (the
  feature-configurable token TokenForge deploys)
- **ERC-721**: TicketSale, CryptoDoggies (NFT tickets and collectibles)
- **Custom order-book DEX**: Exchange (deposits, orders, fills, 10% fee)
- **Factory pattern**: TokenFactory validates a feature bitmap, prices it, and
  deploys a configured ForgeToken per request

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

This project is offered under the MIT License.

Note: there is currently no `LICENSE` file in the repository and `package.json`
declares no `license` field - this section is the only licensing statement.
Adding a `LICENSE` file is a to-do.

## Acknowledgments

- [OpenZeppelin](https://openzeppelin.com/) for secure smart contract implementations
- [Hardhat](https://hardhat.org/) for Ethereum development environment
- [MetaMask](https://metamask.io/) for Web3 wallet connectivity
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) teams for excellent frameworks
- [Material-UI](https://mui.com/) for React components
- [ApexCharts](https://apexcharts.com/) for data visualization

The Security reference page summarizes material from
[The Ethernaut](https://ethernaut.openzeppelin.com/) (OpenZeppelin),
[Solidity by Example](https://solidity-by-example.org/),
[Secureum](https://secureum.substack.com/),
[Slither](https://github.com/crytic/slither) (Trail of Bits),
the [EEA EthTrust Security Levels](https://entethalliance.org/specs/ethtrust-sl/)
specification, and [Polymarket's public audit registry](https://github.com/Polymarket/contract-security).
Those projects are credited as sources and do not endorse this one.

## Contact

For questions, support, or feature requests:
- Open an [issue](../../issues) in this repository
- Check [discussions](../../discussions) for community help

---

**Built with ❤️ by Certified Blockchain Developers**

*Last updated: August 2026*
