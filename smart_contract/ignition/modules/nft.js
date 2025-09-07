const {buildModule} = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("RealEstateNFT", (m) => {

  const realEstateNFT = m.contract("RealEstateNFT");
  return { realEstateNFT };
});
