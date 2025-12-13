const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Copying ABIs to frontend...");

  // Source paths
  const exchangeAbiPath = path.join(__dirname, '../artifacts/contracts/Exchange.sol/Exchange.json');
  const dappTokenAbiPath = path.join(__dirname, '../artifacts/contracts/DappToken.sol/DappToken.json');

  // Destination paths
  const destDir = path.join(__dirname, '../../src/exchange/abis');
  const exchangeDestPath = path.join(destDir, 'Exchange.json');
  const dappTokenDestPath = path.join(destDir, 'DappToken.json');

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
    console.log("Created directory:", destDir);
  }

  // Copy Exchange ABI
  if (fs.existsSync(exchangeAbiPath)) {
    fs.copyFileSync(exchangeAbiPath, exchangeDestPath);
    console.log("✓ Copied Exchange.json");
  } else {
    console.error("✗ Exchange.json not found at:", exchangeAbiPath);
  }

  // Copy DappToken ABI
  if (fs.existsSync(dappTokenAbiPath)) {
    fs.copyFileSync(dappTokenAbiPath, dappTokenDestPath);
    console.log("✓ Copied DappToken.json");
  } else {
    console.error("✗ DappToken.json not found at:", dappTokenAbiPath);
  }

  console.log("\nABIs copied successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
