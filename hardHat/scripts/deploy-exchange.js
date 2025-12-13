const hre = require("hardhat");

async function main() {
  console.log("Starting Exchange deployment...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy DappToken
  console.log("\n1. Deploying DappToken...");
  const DappToken = await hre.ethers.getContractFactory("DappToken");
  const token = await DappToken.deploy(
    "Dapp Token",           // Token name
    "DAPP",                 // Token symbol
    18,                     // Decimals
    1000000                 // Initial supply (1 million tokens)
  );
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("DappToken deployed to:", tokenAddress);

  // Deploy Exchange with fee account, fee percentage, and token address
  const feeAccount = deployer.address; // Fee account is the deployer
  const feePercent = 10; // 10% fee

  console.log("\n2. Deploying Exchange...");
  console.log("   Fee Account:", feeAccount);
  console.log("   Fee Percent:", feePercent + "%");
  console.log("   Token Address:", tokenAddress);

  const Exchange = await hre.ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy(feeAccount, feePercent, tokenAddress);
  await exchange.waitForDeployment();
  const exchangeAddress = await exchange.getAddress();
  console.log("Exchange deployed to:", exchangeAddress);

  // Print summary
  console.log("\n=== Deployment Summary ===");
  console.log("DappToken:", tokenAddress);
  console.log("Exchange:", exchangeAddress);
  console.log("Fee Account:", feeAccount);
  console.log("Fee Percent:", feePercent + "%");
  console.log("\nNetwork:", hre.network.name);

  // Save deployment info to a file
  const fs = require('fs');
  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      DappToken: tokenAddress,
      Exchange: exchangeAddress
    },
    config: {
      feeAccount: feeAccount,
      feePercent: feePercent,
      tokenAddress: tokenAddress
    },
    timestamp: new Date().toISOString()
  };

  // Save deployment info to hardHat folder
  fs.writeFileSync(
    'deployment-exchange.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("\nDeployment info saved to deployment-exchange.json");

  // Also copy to public folder for frontend access
  const path = require('path');
  const publicDeploymentPath = path.join(__dirname, '../../public/hardHat/deployment-exchange.json');
  const publicDir = path.dirname(publicDeploymentPath);

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(publicDeploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info copied to public folder");

  // Copy ABIs to frontend
  console.log("\n3. Copying ABIs to frontend...");

  const exchangeAbiPath = path.join(__dirname, '../artifacts/contracts/Exchange.sol/Exchange.json');
  const dappTokenAbiPath = path.join(__dirname, '../artifacts/contracts/DappToken.sol/DappToken.json');

  const destDir = path.join(__dirname, '../../src/exchange/abis');
  const exchangeDestPath = path.join(destDir, 'Exchange.json');
  const dappTokenDestPath = path.join(destDir, 'DappToken.json');

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.copyFileSync(exchangeAbiPath, exchangeDestPath);
  console.log("   ✓ Copied Exchange.json");

  fs.copyFileSync(dappTokenAbiPath, dappTokenDestPath);
  console.log("   ✓ Copied DappToken.json");

  console.log("\n✓ Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
