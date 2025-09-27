const { ethers} = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy IdentityRegistry
  const IdentityRegistry = await ethers.getContractFactory("IdentityRegistry");
  const identityRegistry = await IdentityRegistry.deploy();
  await identityRegistry.waitForDeployment();
  console.log("IdentityRegistry deployed at:", await identityRegistry.getAddress());

  // Deploy ComplianceModule with IdentityRegistry address
  const ComplianceModule = await ethers.getContractFactory("ComplianceModule");
  const complianceModule = await ComplianceModule.deploy(await identityRegistry.getAddress());
  await complianceModule.waitForDeployment();
  console.log("ComplianceModule deployed at:", await complianceModule.getAddress());

  // Deploy MultiPropertyTokenManager with IdentityRegistry & ComplianceModule addresses
  const MultiPropertyTokenManager = await ethers.getContractFactory("MultiPropertyTokenManager");
  const multiPropertyTokenManager = await MultiPropertyTokenManager.deploy(
    await identityRegistry.getAddress(),
    await complianceModule.getAddress()
  );
  await multiPropertyTokenManager.waitForDeployment();
  console.log("MultiPropertyTokenManager deployed at:", await multiPropertyTokenManager.getAddress());

  // Add a sample property
  const tx = await multiPropertyTokenManager.addProperty(
    "Sample Property Token",
    "SPT",
    deployer.address,  // creator wallet address
    ethers.encodeBytes32String("deed_hash_example"),
    ethers.encodeBytes32String("appraisal_hash_example"),
    ethers.encodeBytes32String("kyc_hash_example")
  );

  const receipt = await tx.wait();
  const event = receipt.logs.find(log => {
    try {
      const parsed = multiPropertyTokenManager.interface.parseLog(log);
      return parsed && parsed.name === "PropertyAdded";
    } catch (e) {
      return false;
    }
  });

  if (event) {
    const parsed = multiPropertyTokenManager.interface.parseLog(event);
    const propertyId = parsed.args.propertyId.toString();
    console.log(`Property added with ID: ${propertyId}`);
  } else {
    console.log("PropertyAdded event not found");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
