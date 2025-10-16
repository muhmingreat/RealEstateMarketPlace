const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const mockAddress ='0x7b171287EDE20bF8dE49F0FEeA89CE64a20F5031'

module.exports = buildModule("RealEstateModule", (m) => {
  // For now: dummy values, because you're still in dev mode
  const chainlinkOracle   = "0x0000000000000000000000000000000000000001"; 
  const chainlinkJobId    = ethers.encodeBytes32String("dummy-job"); 
  const chainlinkFee      = ethers.parseEther("0"); 
  
  const linkTokenAddress  = "0x0000000000000000000000000000000000000001"; 
    const mockOracle        = mockAddress // NEW

  // Deploy RealEstate
  const realEstate = m.contract("RealEstate", [
    // chainlinkOracle,
    // chainlinkJobId,
    // chainlinkFee,
    // linkTokenAddress,
    // mockOracle
  ], {
    afterDeploy: async (ctx) => {
      const nftAddress = await ctx.contract.propertyNFT();
      console.log("✅ RealEstate deployed at:", ctx.contract.address);
      console.log("✅ Internal RealEstateNFT deployed at:", nftAddress);
    },
  });

  return { realEstate };
});


