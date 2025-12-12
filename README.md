# Certified Blockchain DApp

[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![React](https://img.shields.io/badge/React-18.2-61DAFB.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF.svg)](https://vitejs.dev/)
[![Web3.js](https://img.shields.io/badge/Web3.js-1.7.4-F16822.svg)](https://web3js.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive Web3 decentralized application (DApp) built with React, Vite, and Ethereum smart contracts. This project showcases multiple blockchain use cases including pet adoption, token sales, voting systems, auctions, and more.

> **Live Demo:** Deployed on Sepolia Testnet - Connect MetaMask to interact

## Features

### Core Applications

- **Pet Adoption DApp** - Adopt virtual pets secured on the blockchain
- **Token Management** - ERC-20 token implementation with crowdsale functionality
- **Voting Systems** - Democratic and weighted voting mechanisms
- **Auction Platform** - Decentralized auction system
- **Chat & Messaging** - Blockchain-based communication
- **Certificate Management** - Digital certificate issuance and verification
- **Crypto Doggies** - NFT-style collectible game
- **Guessing Game** - Interactive blockchain gaming
- **Ticket Sales** - Event ticket distribution system
- **Task Management** - Decentralized todo list

### Technical Highlights

- Modern React 18 with Hooks
- Vite for lightning-fast development
- Web3.js integration for Ethereum interactions
- MetaMask connectivity
- Multi-chain support (Mainnet, Goerli, Sepolia, Hardhat, Ganache)
- Responsive design with Bootstrap 5
- Real-time transaction notifications
- Beautiful gradient UI with smooth animations
- Type-safe with PropTypes

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MetaMask](https://metamask.io/) browser extension
- [Hardhat](https://hardhat.org/) or [Ganache](https://trufflesuite.com/ganache/) for local blockchain

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CertifiedBlockchainHardhat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_CONTRACT_ADDRESS=your_contract_address
   VITE_INFURA_KEY=your_infura_key
   ```

4. **Start local blockchain** (optional for development)
   ```bash
   npx hardhat node
   # or
   ganache-cli
   ```

5. **Deploy contracts**
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The application will start at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
certifiedblockchain/
├── contracts/                    # Solidity smart contracts (15 contracts)
│   ├── Adoption.sol             # Pet adoption tracking
│   ├── Auction.sol              # Decentralized auction
│   ├── Certificate.sol          # Digital certificate issuance
│   ├── ChatBoxPlus.sol          # Chat + TicTacToe game
│   ├── CryptoDoggies.sol        # NFT collectibles (ERC-721)
│   ├── DappToken.sol            # ERC-20 token
│   ├── DappTokenSale.sol        # Token crowdsale (ICO)
│   ├── Email.sol                # Decentralized messaging
│   ├── GuessingGame.sol         # Blockchain betting game
│   ├── Poll.sol                 # Polling/survey system
│   ├── Task.sol                 # Task/todo manager
│   ├── TicketSale.sol           # NFT event tickets (ERC-721)
│   ├── TicTacToe.sol            # Standalone game
│   ├── Voting.sol               # Democratic voting
│   └── WeightedVoting.sol       # Weighted voting system
│
├── src/
│   ├── components/
│   │   ├── config/              # Contract ABIs & addresses (15 config files)
│   │   │   ├── AdoptionConfig.js
│   │   │   ├── AuctionConfig.js
│   │   │   ├── CertificateConfig.js
│   │   │   └── ...
│   │   ├── css/                 # Component stylesheets
│   │   ├── images/              # Pet images for adoption
│   │   ├── pollCommon/          # Poll form components
│   │   ├── Card.jsx             # Reusable card component
│   │   ├── ConfirmDialog.jsx    # Confirmation modal
│   │   ├── ContractInfo.jsx     # Contract details dialog
│   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   ├── navBar.jsx           # Navigation component
│   │   └── ...
│   │
│   ├── adoption.jsx             # Pet adoption page
│   ├── App.jsx                  # Main app with routing
│   ├── Auction.jsx              # Auction platform
│   ├── Certificate.jsx          # Certificate verification
│   ├── chatBoxStable.jsx        # Chat + game interface
│   ├── CryptoDoggies.jsx        # NFT marketplace
│   ├── dappToken.jsx            # Token wallet
│   ├── dappTokenSale.jsx        # ICO interface
│   ├── Email.jsx                # Messaging system
│   ├── GuessingGame.jsx         # Higher/Lower game
│   ├── Poll.jsx                 # Polling system
│   ├── Task.jsx                 # Task manager
│   ├── TicketSale.jsx           # Event ticketing
│   ├── Voting.jsx               # Voting interface
│   ├── WeightedVoting.jsx       # Weighted voting
│   └── ...
│
├── scripts/                     # Deployment scripts
├── test/                        # Contract tests
├── hardhat.config.js            # Hardhat configuration
├── vite.config.js               # Vite configuration
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

Update contract configurations in `src/components/config/`:

```javascript
export const ADOPTION_ADDRESS = 'YOUR_CONTRACT_ADDRESS';
export const ADOPTION_ABI = [ /* YOUR ABI */ ];
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
| CryptoDoggies | `0xdbF365c5c131BcBCF20541926450436E2Dd8Bba7` | [View Contract](https://eth-sepolia.blockscout.com/address/0xdbF365c5c131BcBCF20541926450436E2Dd8Bba7?tab=contract) |
| DappToken | `0xfc557fA2A750ECaa504FE1a4AEF48D90F3E74c86` | [View Contract](https://eth-sepolia.blockscout.com/address/0xfc557fA2A750ECaa504FE1a4AEF48D90F3E74c86?tab=contract) |
| DappTokenSale | `0xD85E2446A1C3421612BE36cB6077B308F47D2B03` | [View Contract](https://eth-sepolia.blockscout.com/address/0xD85E2446A1C3421612BE36cB6077B308F47D2B03?tab=contract) |
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

## Key Features

### Modern UI/UX

- Gradient-based design with smooth animations
- Hover effects and transitions
- Responsive grid layout
- Loading states and spinners
- Toast notifications for all actions
- Dark mode support

### Web3 Integration

- Automatic MetaMask detection
- Network change handling
- Account change handling
- Transaction status tracking
- Gas estimation
- Error handling with user-friendly messages

### Performance

- Lazy loading for images
- Optimized re-renders with React hooks
- Memoized values for expensive computations
- Code splitting with React Router

## Technologies Used

### Frontend

- React 18.2
- Vite 5.0
- React Router DOM 6.20
- React Bootstrap 2.7
- Styled Components 5.3
- ApexCharts 4.0 (for data visualization)

### Blockchain

- Web3.js 1.7.4
- Ethers.js 6.12.1
- MetaMask Detect Provider
- Solidity 0.8.19
- Hardhat / Truffle

### UI/UX

- Bootstrap 5.2
- Font Awesome 4.7
- React Toastify 9.1
- Custom CSS with animations
- Material-UI 5.10

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

- Never commit private keys or seed phrases
- Always verify contract addresses
- Test on testnets before mainnet
- Use environment variables for sensitive data
- Keep dependencies updated

## Smart Contract Architecture

### ERC Standards Implemented
- **ERC-20**: DappToken (fungible token with decimals)
- **ERC-721**: TicketSale, CryptoDoggies (NFT tickets and collectibles)

### Security Patterns
- Reentrancy guards on all payable functions
- Access control (owner-only functions)
- SafeMath (built into Solidity 0.8+)
- Pausable functionality (CryptoDoggies)
- Input validation and require statements

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

*Last updated: December 2024*
