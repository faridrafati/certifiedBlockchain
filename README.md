# Certified Blockchain DApp

A comprehensive Web3 decentralized application (DApp) built with React, Vite, and Ethereum smart contracts. This project showcases multiple blockchain use cases including pet adoption, token sales, voting systems, auctions, and more.

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
CertifiedBlockchainHardhat/
├── src/
│   ├── components/       # Reusable components
│   │   ├── css/         # Component styles
│   │   ├── images/      # Image assets
│   │   ├── config/      # Contract configurations
│   │   └── pets.json    # Pet data
│   ├── adoption.jsx     # Pet adoption component
│   ├── App.jsx          # Main application component
│   ├── index.jsx        # Application entry point
│   ├── HideShow.js      # Contract info display
│   ├── resetProvider.js # Web3 provider management
│   └── [other components]
├── public/              # Static assets
├── contracts/           # Smart contracts (Solidity)
├── vite.config.js       # Vite configuration
├── package.json         # Dependencies
└── README.md           # This file
```

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

| Contract | Address | Etherscan |
|----------|---------|-----------|
| Adoption | `0x625E384A39d8A3C50FA8C5EbEf39a664E9e7eC17` | [View](https://sepolia.etherscan.io/address/0x625E384A39d8A3C50FA8C5EbEf39a664E9e7eC17) |
| Auction | `0xAc07aB3BEEFBB0D107e6f975d48527cF3C16a7E6` | [View](https://sepolia.etherscan.io/address/0xAc07aB3BEEFBB0D107e6f975d48527cF3C16a7E6) |
| Certificate | `0xca1daC5e14Df6CE19ed3a7185250bEB8A3c895F6` | [View](https://sepolia.etherscan.io/address/0xca1daC5e14Df6CE19ed3a7185250bEB8A3c895F6) |
| ChatBoxPlus | `0xBAbe5292d01Cc5F0986AD6B2451A2Ef24b9c5d59` | [View](https://sepolia.etherscan.io/address/0xBAbe5292d01Cc5F0986AD6B2451A2Ef24b9c5d59) |
| CryptoDoggies | `0xdbF365c5c131BcBCF20541926450436E2Dd8Bba7` | [View](https://sepolia.etherscan.io/address/0xdbF365c5c131BcBCF20541926450436E2Dd8Bba7) |
| DappToken | `0xfc557fA2A750ECaa504FE1a4AEF48D90F3E74c86` | [View](https://sepolia.etherscan.io/address/0xfc557fA2A750ECaa504FE1a4AEF48D90F3E74c86) |
| DappTokenSale | `0xD85E2446A1C3421612BE36cB6077B308F47D2B03` | [View](https://sepolia.etherscan.io/address/0xD85E2446A1C3421612BE36cB6077B308F47D2B03) |
| Email | `0xF0307B91AF329eAE1f1d24EaAd629108C21592DC` | [View](https://sepolia.etherscan.io/address/0xF0307B91AF329eAE1f1d24EaAd629108C21592DC) |
| GuessingGame | `0xD2b1a870390fEDEc46a06f9870EdEDc5d8F53F84` | [View](https://sepolia.etherscan.io/address/0xD2b1a870390fEDEc46a06f9870EdEDc5d8F53F84) |
| Poll | `0x67C446683398483d54E8c3FF3541a54a5447a6c1` | [View](https://sepolia.etherscan.io/address/0x67C446683398483d54E8c3FF3541a54a5447a6c1) |
| Task | `0xBC37Fe3301C9818Cb7193b510314A141Fc0adA81` | [View](https://sepolia.etherscan.io/address/0xBC37Fe3301C9818Cb7193b510314A141Fc0adA81) |
| TicTacToe | `0x0DA72f02B5c533A2399112292683CD5dAa15580B` | [View](https://sepolia.etherscan.io/address/0x0DA72f02B5c533A2399112292683CD5dAa15580B) |
| Voting | `0x0A917e204214FE1F6Fa9A9cAFdfE18B9184865d8` | [View](https://sepolia.etherscan.io/address/0x0A917e204214FE1F6Fa9A9cAFdfE18B9184865d8) |
| WeightedVoting | `0x89feB6297b6AEC69Bbb81A69a20209Fc89f9128E` | [View](https://sepolia.etherscan.io/address/0x89feB6297b6AEC69Bbb81A69a20209Fc89f9128E) |
| TicketSale | `0xa00f3Ebca957fDC1bC7FB13609cB616B17C879CE` | [View](https://sepolia.etherscan.io/address/0xa00f3Ebca957fDC1bC7FB13609cB616B17C879CE) |

> **Network:** Sepolia Testnet
> **Chain ID:** 11155111
> **Explorer:** https://sepolia.etherscan.io

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

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Acknowledgments

- OpenZeppelin for secure smart contract implementations
- Truffle Suite for development tools
- MetaMask for Web3 connectivity
- React and Vite teams for excellent frameworks

## Contact

For questions or support, please open an issue in the repository.

---

Built with by Certified Blockchain Developers
