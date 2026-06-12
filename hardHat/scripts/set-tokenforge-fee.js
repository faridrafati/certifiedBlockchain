/**
 * Admin: set the TokenForge network fee multiplier so users pay a real fee.
 *
 *   npx hardhat run scripts/set-tokenforge-fee.js --network sepolia
 *
 * MULTIPLIER_BPS: 10000 = 1.0x (full chart), 500 = 0.05x, 0 = free.
 * 0.05x keeps testnet fees affordable (base ~0.0025 ETH) while still requiring
 * payment. Change the constant below to charge more/less. Must be run by the
 * factory owner (the deployer wallet in .env PRIVATE_KEY).
 */
const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

const MULTIPLIER_BPS = 500; // 0.05x

async function main() {
  const dep = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "deployment-tokenforge.json"), "utf8"));
  const factoryAddr = dep.contracts.TokenFactory;
  const [signer] = await hre.ethers.getSigners();
  const factory = await hre.ethers.getContractAt("TokenFactory", factoryAddr, signer);

  const owner = await factory.owner();
  console.log("Factory:", factoryAddr);
  console.log("Owner:  ", owner);
  console.log("Signer: ", signer.address);
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Signer is not the factory owner; set PRIVATE_KEY to the owner wallet.");
  }

  const before = await factory.networkMultiplierBps();
  console.log("Multiplier before:", before.toString(), "bps");
  const tx = await factory.setNetworkMultiplier(MULTIPLIER_BPS);
  await tx.wait();
  const after = await factory.networkMultiplierBps();
  console.log("Multiplier after: ", after.toString(), `bps (${Number(after) / 10000}x)`);

  const base = await factory.requiredFee(0n);
  const essential = await factory.requiredFee((1n << 3n) | (1n << 5n) | (1n << 7n) | (1n << 8n) | (1n << 9n) | (1n << 12n));
  console.log("Example fees now:");
  console.log("  base token:", hre.ethers.formatEther(base), "ETH");
  console.log("  Essential :", hre.ethers.formatEther(essential), "ETH");
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
