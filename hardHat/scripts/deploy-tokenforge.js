/**
 * Deploys the TokenForge suite: ForgeTokenDeployer + TokenFactory.
 *
 * Usage:
 *   npx hardhat run scripts/deploy-tokenforge.js --network localhost
 *   npx hardhat run scripts/deploy-tokenforge.js --network sepolia
 *
 * Network multiplier (bps): 10000 = 1.0x (mainnet), 2000 = 0.2x (L2),
 * 0 = free (testnets). Defaults below set Sepolia/localhost to free.
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const net = hre.network.name;
  console.log(`Deploying TokenForge to ${net} as ${deployer.address}`);

  // base price 0.05 ETH; free on testnets/local, 1.0x otherwise
  const basePrice = hre.ethers.parseEther("0.05");
  const multiplierBps = net === "mainnet" ? 10000 : net === "sepolia" || net === "localhost" || net === "hardhat" ? 0 : 2000;

  const Deployer = await hre.ethers.getContractFactory("ForgeTokenDeployer");
  const forgeDeployer = await Deployer.deploy();
  await forgeDeployer.waitForDeployment();
  const deployerAddr = await forgeDeployer.getAddress();
  console.log("ForgeTokenDeployer:", deployerAddr);

  const Factory = await hre.ethers.getContractFactory("TokenFactory");
  const factory = await Factory.deploy(
    deployer.address,     // owner
    deployer.address,     // treasury
    basePrice,
    multiplierBps,
    deployerAddr
  );
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("TokenFactory:", factoryAddr);
  console.log(`\nAdd to .env:\n  VITE_TOKENFORGE_FACTORY_ADDRESS=${factoryAddr}\n`);

  const out = {
    network: net,
    deployer: deployer.address,
    contracts: { ForgeTokenDeployer: deployerAddr, TokenFactory: factoryAddr },
    config: { basePrice: basePrice.toString(), networkMultiplierBps: multiplierBps },
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(__dirname, "..", "deployment-tokenforge.json"),
    JSON.stringify(out, null, 2)
  );
  console.log("Wrote deployment-tokenforge.json");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
