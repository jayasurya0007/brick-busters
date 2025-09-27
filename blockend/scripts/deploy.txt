const hre = require("hardhat");

async function main() {
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get contract factory
  const UserRegistry = await hre.ethers.getContractFactory("MyContract");

  // Deploy contract (no constructor args)
  const registry = await UserRegistry.deploy("Hello");

  // Wait for deployment and print address
  console.log("UserRegistry deployed at:", registry.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

